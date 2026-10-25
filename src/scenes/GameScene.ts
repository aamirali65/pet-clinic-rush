import Phaser from 'phaser';
import { FAST_CURE_SECONDS } from '@/config/constants';
import { getCustomer } from '@/config/customers';
import { LEVEL_LIST } from '@/config/levels';
import { NEEDS } from '@/config/needs';
import { PET_LIST, getPet } from '@/config/pets';
import { SCENES } from '@/config/sceneKeys';
import { bus as eventBus } from '@/contracts/events';
import type {
  GameSceneData,
  LevelConfig,
  LevelResult,
  NeedKind,
  PetKind,
  ToolKind,
} from '@/contracts/types';
import { Bed } from '@/objects/Bed';
import { Celebration } from '@/objects/Celebration';
import { Customer } from '@/objects/Customer';
import { Pet } from '@/objects/Pet';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { save } from '@/services/SaveService';
import { LevelSystem } from '@/systems/LevelSystem';
import { ScoreSystem } from '@/systems/ScoreSystem';
import { SpawnSystem } from '@/systems/SpawnSystem';
import { buildLevelResult, goalReached } from '@/systems/StarSystem';
import { TreatmentOverlay } from '@/ui/TreatmentOverlay';
import { ToolTray } from '@/ui/ToolTray';
import { COLORS, CSS, FONT_FAMILY } from '@/ui/theme';

interface PatientRecord {
  id: number;
  customer: Customer;
  pet: Pet | null;
  bed: Bed | null;
  placedAt: number | null;
  needsTotal: number;
}

interface PlayLayout {
  beds: number;
  slots: number;
}

export class GameScene extends Phaser.Scene {
  private level!: LevelConfig;
  private levelIndex = 0;
  private scoreSystem = new ScoreSystem();
  private spawnSystem!: SpawnSystem;
  private levelSystem!: LevelSystem;
  private beds: Bed[] = [];
  private customers: Customer[] = [];
  private records = new Map<number, PatientRecord>();
  private patientSeq = 1;
  private slotCount = 3;
  private patienceBonus = 0;
  private toolSpeed = 1;
  private coinBonus = 0;
  private bedUpgrades = 0;
  private waitingUpgrades = 0;
  private allowedPets: PetKind[] = [];
  private heldPet: Pet | null = null;
  private heldFrom: Customer | null = null;
  private heldPointerId: number | null = null;
  private pointerStartX = 0;
  private pointerStartY = 0;
  private selectedBed: Bed | null = null;
  private tray!: ToolTray;
  private treatment: TreatmentOverlay | null = null;
  private treatmentPatientId: number | null = null;
  private ended = false;
  private running = false;
  private hintText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super(SCENES.Game);
  }

  init(data: GameSceneData): void {
    const requested = Number(data?.levelId ?? 1);
    this.levelIndex = Phaser.Math.Clamp(
      LEVEL_LIST.findIndex((level) => level.id === requested),
      0,
      LEVEL_LIST.length - 1,
    );
    this.level = LEVEL_LIST[this.levelIndex]!;
    this.ended = false;
    this.running = false;
    this.beds = [];
    this.customers = [];
    this.records.clear();
    this.patientSeq = 1;
    this.heldPet = null;
    this.heldFrom = null;
    this.heldPointerId = null;
    this.selectedBed = null;
    this.treatment = null;
    this.scoreSystem.reset(0);

    const data2 = save.getData();
    this.bedUpgrades = ['bed-1', 'bed-2'].filter((id) => save.hasUpgrade(id)).length;
    this.waitingUpgrades = ['waiting-1', 'waiting-2'].filter((id) => save.hasUpgrade(id)).length;
    this.patienceBonus = 0;
    this.coinBonus = 0;
    this.toolSpeed = 1;
    for (const [id, owned] of Object.entries(data2.upgrades)) {
      if (!owned) continue;
      if (id.startsWith('patience-')) this.patienceBonus += 0.12;
      if (id.startsWith('coins-')) this.coinBonus += id === 'coins-2' ? 15 : 10;
      if (id.startsWith('speed-')) this.toolSpeed += 0.15;
    }
    this.scoreSystem.reset(this.coinBonus);
    const unlocked = PET_LIST.map((pet) => pet.kind).filter((kind) => save.hasPet(kind));
    const allowed = this.level.allowedPets.filter((kind) => unlocked.includes(kind));
    this.allowedPets = allowed.length > 0 ? allowed : ['cat'];
  }

  create(): void {
    this.add.image(360, 640, 'bg-clinic').setDepth(0);
    this.add.image(80, 310, 'door').setScale(0.92).setDepth(10);
    this.add.image(662, 960, 'plant').setScale(1.15).setDepth(12);
    this.add
      .text(80, 452, 'PATIENTS', {
        fontFamily: FONT_FAMILY,
        fontSize: '15px',
        fontStyle: 'bold',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setAlpha(0.55)
      .setDepth(11);

    const layout = this.computeLayout();
    this.createChairs(layout.slots);
    this.createBeds(layout.beds);

    this.spawnSystem = new SpawnSystem(this.level.spawnInterval);
    this.levelSystem = new LevelSystem(this.level.timeLimit);
    this.tray = new ToolTray(
      this,
      (tool) => this.onToolSelected(tool),
      () => {
        this.selectedBed = null;
      },
    );

    this.scene.launch(SCENES.Hud, {
      levelId: this.level.id,
      target: this.level.goal.target,
      timeLimit: this.level.timeLimit,
      coins: 0,
      hearts: this.scoreSystem.hearts,
      score: 0,
    });

    this.input.on('pointerdown', this.handleBedPointer, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    this.game.events.on(Phaser.Core.Events.HIDDEN, this.handleHidden, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);

    this.showIntro();
    this.time.delayedCall(1250, () => {
      if (this.ended) return;
      this.running = true;
      this.spawnSystem.start();
      this.levelSystem.start();
      this.spawnCustomer();
      this.emitHudState();
      eventBus.emit('level:started', { levelId: this.level.id });
      this.showHint('Tap a customer to pick up their pet.');
    });
  }

  update(time: number, delta: number): void {
    if (!this.running || this.ended) return;
    if (!this.scene.isPaused()) {
      this.updatePatients(delta);
      this.updateSpawner(delta);
      this.updateTimer();
      this.treatment?.update(time, delta);
      if (this.heldPet) this.updateBedHighlights();
    }
  }

  private computeLayout(): PlayLayout {
    const beds = Math.min(5, this.level.maxBeds + this.bedUpgrades);
    const slots = Math.min(5, 3 + this.waitingUpgrades);
    this.slotCount = slots;
    return { beds, slots };
  }

  private createChairs(slots: number): void {
    for (let i = 1; i <= slots; i += 1) {
      const x = (720 / (slots + 1)) * i;
      this.add.image(x, 565, 'chair').setScale(0.82).setDepth(11);
    }
  }

  private createBeds(count: number): void {
    const positions =
      count <= 3
        ? [180, 360, 540]
        : count === 4
          ? [118, 280, 442, 604]
          : [88, 224, 360, 496, 632];
    const scale = count >= 5 ? 0.72 : count === 4 ? 0.86 : 1;
    positions.forEach((x, index) => {
      this.beds.push(new Bed(this, x, 835, index, scale));
    });
  }

  private showIntro(): void {
    const banner = this.add.container(360, 400).setDepth(300);
    const shadow = this.add.rectangle(0, 10, 520, 210, COLORS.shadow, 0.18);
    shadow.setOrigin(0.5);
    const card = this.add.graphics();
    card.fillStyle(COLORS.paper, 1);
    card.fillRoundedRect(-260, -105, 520, 210, 34);
    card.fillStyle(COLORS.mint, 1);
    card.fillRoundedRect(-260, -105, 520, 16, 8);
    const levelText = this.add
      .text(0, -48, `LEVEL ${this.level.id}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: CSS.blue,
        letterSpacing: 3,
      })
      .setOrigin(0.5);
    const title = this.add
      .text(0, 4, this.levelTitle(), {
        fontFamily: FONT_FAMILY,
        fontSize: '42px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0.5);
    const goal = this.add
      .text(0, 58, `Cure ${this.level.goal.target} pets`, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5);
    banner.add([shadow, card, levelText, title, goal]);
    banner.setScale(0.85);
    this.tweens.add({
      targets: banner,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut',
    });
    this.tweens.add({
      targets: banner,
      alpha: 0,
      y: 360,
      delay: 1450,
      duration: 350,
      onComplete: () => banner.destroy(),
    });
  }

  private levelTitle(): string {
    const titles = [
      'First Paws',
      'Waiting Room',
      'Sniffles',
      'Fluffy Friends',
      'Busy Morning',
      'New Faces',
      'Helping Hands',
      'Rush Hour',
      'Squeaky Clean',
      'Happy Tails',
      'Full House',
      'Careful Hands',
      'Clinic Stars',
      'Rainy Day',
      'All Paws',
      'Doctor Dash',
      'Tiny Patients',
      'Fast Feet',
      'Super Clinic',
      'Pet Clinic Rush',
    ];
    return titles[this.levelIndex] ?? 'Pet Clinic';
  }

  private updateSpawner(delta: number): void {
    if (!this.spawnSystem.isRunning) return;
    const canSpawn =
      this.records.size < this.level.maxPetsOnScreen && this.freeSlot() !== null;
    if (this.spawnSystem.update(delta, canSpawn)) this.spawnCustomer();
  }

  private freeSlot(): number | null {
    for (let slot = 0; slot < this.slotCount; slot += 1) {
      if (!this.customers.some((customer) => customer.slot === slot)) return slot;
    }
    return null;
  }

  private spawnCustomer(): void {
    if (this.ended || !this.running) return;
    const slot = this.freeSlot();
    if (slot === null) return;
    if (this.records.size >= this.level.maxPetsOnScreen) return;

    const petKind = Phaser.Utils.Array.GetRandom(this.allowedPets);
    const petConfig = getPet(petKind) ?? PET_LIST[0]!;
    const count = Phaser.Math.Clamp(this.level.needsPerPet, 1, 4);
    const pool = Phaser.Utils.Array.Shuffle([...petConfig.needs]);
    const needs = pool.slice(0, count).map((need) => need.kind);
    const customerConfig = getCustomer(Phaser.Math.Between(0, 7));
    const patience =
      customerConfig.patience * this.level.patienceMultiplier * (1 + this.patienceBonus);
    const x = (720 / (this.slotCount + 1)) * (slot + 1);

    const customer = new Customer(this, 76, 405, {
      id: customerConfig.id,
      petKind,
      needs,
      patience,
      slot,
    });
    customer.setAlpha(0);
    customer.setScale(0.9);
    customer.setBubbleScale(this.slotCount >= 5 ? 0.6 : this.slotCount === 4 ? 0.66 : 0.72);
    customer.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.pickUp(customer, pointer);
    });
    this.customers.push(customer);
    const record: PatientRecord = {
      id: this.patientSeq,
      customer,
      pet: null,
      bed: null,
      placedAt: null,
      needsTotal: needs.length,
    };
    this.patientSeq += 1;
    this.records.set(record.id, record);

    this.tweens.add({
      targets: customer,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 260,
    });
    customer.moveToWaiting(x, 590, 700);
    audio.play('open', 0.3);
    haptics.light();
    this.updateBedHighlights();
  }

  private updatePatients(delta: number): void {
    const multiplier = 1;
    for (const customer of [...this.customers]) {
      if (!customer.active) continue;
      if (customer.updatePatience(delta, multiplier)) {
        this.onPatientAngry(customer);
      }
    }
  }

  private updateTimer(): void {
    const state = this.levelSystem.update(this.game.loop.delta);
    if (state.ticked) {
      eventBus.emit('timer:tick', { secondsRemaining: this.levelSystem.secondsLeft });
    }
    if (state.expired) this.finish(false, 'time');
  }

  private pickUp(customer: Customer, pointer: Phaser.Input.Pointer): void {
    if (this.ended || !this.running || this.heldPet || this.treatment) return;
    if (this.tray.isOpen) {
      this.tray.hide();
      return;
    }
    const record = [...this.records.values()].find((item) => item.customer === customer);
    if (!record || record.bed || record.pet) return;
    if (customer.patienceLeft <= 0) return;

    const pet = new Pet(this, customer.x, customer.y - 100, record.id, customer.petKind, customer.needs);
    pet.setHeld(true);
    this.heldPet = pet;
    this.heldFrom = customer;
    this.heldPointerId = pointer.id;
    this.pointerStartX = pointer.worldX;
    this.pointerStartY = pointer.worldY;
    record.pet = pet;
    customer.setCarrying(false);
    customer.disableInteractive();
    this.followPointer(pointer.worldX, pointer.worldY);
    this.updateBedHighlights();
    this.hideHint();
    audio.play('pick', 0.55);
    haptics.light();
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.heldPet) return;
    if (this.heldPointerId !== null && pointer.id !== this.heldPointerId) return;
    this.followPointer(pointer.worldX, pointer.worldY);
    this.updateBedHighlights();
  }

  private followPointer(x: number, y: number): void {
    if (!this.heldPet) return;
    const px = Phaser.Math.Clamp(x, 50, 670);
    const py = Phaser.Math.Clamp(y - 24, 220, 1080);
    this.heldPet.setPosition(px, py);
  }

  private handlePointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.heldPet) return;
    if (this.heldPointerId !== null && pointer.id !== this.heldPointerId) return;
    const moved = Phaser.Math.Distance.Between(
      this.pointerStartX,
      this.pointerStartY,
      pointer.worldX,
      pointer.worldY,
    );
    const bed = this.bedAt(pointer.worldX, pointer.worldY);
    if (bed) {
      if (!bed.isFree) {
        bed.reject();
        this.showHint('That bed is already taken.');
        audio.play('wrong', 0.4);
        return;
      }
      this.placeOnBed(bed);
      return;
    }
    if (moved < 18) {
      this.heldPointerId = null;
      this.showHint('Now tap a free bed to place the pet.');
      return;
    }
    this.returnPet();
  }

  private bedAt(x: number, y: number): Bed | null {
    return this.beds.find((bed) => bed.contains(x, y)) ?? null;
  }

  private handleBedPointer(pointer: Phaser.Input.Pointer): void {
    if (!this.running || this.ended || this.treatment) return;
    const bed = this.bedAt(pointer.worldX, pointer.worldY);
    if (!bed) {
      if (this.tray.isOpen && !this.tray.getBounds().contains(pointer.x, pointer.y)) {
        this.tray.hide();
      }
      return;
    }
    this.onBedTapped(bed);
  }

  private placeOnBed(bed: Bed): void {
    if (!this.heldPet || !this.heldFrom) return;
    const pet = this.heldPet;
    const customer = this.heldFrom;
    const record = this.records.get(pet.patientId);
    bed.place(pet);
    pet.setHeld(false);
    this.heldPet = null;
    this.heldFrom = null;
    this.heldPointerId = null;
    if (record) {
      record.bed = bed;
      record.placedAt = this.time.now;
      const offset = bed.x > 500 ? -66 : 66;
      customer.moveToBed(bed.x + offset, 978);
    }
    this.beds.forEach((item) => item.setHighlight(false));
    audio.play('place', 0.6);
    haptics.medium();
    this.tweens.add({
      targets: pet,
      scaleX: 1.08,
      scaleY: 1.08,
      duration: 160,
      yoyo: true,
    });
    this.showHint('Tap the bed, then choose the right tool.');
    this.time.delayedCall(900, () => {
      if (!this.ended && this.selectedBed === null && !this.tray.isOpen && !this.treatment) {
        this.openTrayFor(bed);
      }
    });
  }

  private returnPet(): void {
    if (!this.heldPet || !this.heldFrom) return;
    this.heldFrom.setCarrying(true);
    this.heldFrom.setInteractive(
      new Phaser.Geom.Rectangle(0, 0, 120, 220),
      Phaser.Geom.Rectangle.Contains,
    );
    const record = this.records.get(this.heldPet.patientId);
    if (record) record.pet = null;
    this.heldPet.destroy();
    this.heldPet = null;
    this.heldFrom = null;
    this.heldPointerId = null;
    this.beds.forEach((bed) => bed.setHighlight(false));
  }

  private updateBedHighlights(): void {
    if (!this.heldPet) {
      this.beds.forEach((bed) => bed.setHighlight(false));
      return;
    }
    for (const bed of this.beds) {
      const near =
        Phaser.Math.Distance.Between(
          this.heldPet.x,
          this.heldPet.y,
          bed.x,
          bed.y - 20,
        ) < 170;
      bed.setHighlight(near && bed.isFree);
    }
  }

  private onBedTapped(bed: Bed): void {
    if (this.ended || !this.running || this.treatment) return;
    if (this.heldPet) {
      if (!bed.isFree) {
        bed.reject();
        this.showHint('That bed is already taken.');
        audio.play('wrong', 0.35);
        return;
      }
      this.placeOnBed(bed);
      return;
    }
    if (bed.isFree) {
      bed.reject();
      audio.play('wrong', 0.25);
      return;
    }
    if (this.tray.isOpen && this.selectedBed === bed) {
      this.tray.hide();
      return;
    }
    this.openTrayFor(bed);
  }

  private openTrayFor(bed: Bed): void {
    if (bed.isFree) return;
    this.selectedBed = bed;
    this.tray.show();
    audio.play('open', 0.3);
  }

  private onToolSelected(tool: ToolKind): void {
    const bed = this.selectedBed;
    if (!bed || this.treatment) return;
    const pet = bed.currentPet;
    if (!pet) return;
    const needKind = pet.remainingNeeds.find((kind) => NEEDS[kind].tool === tool);
    if (!needKind) {
      const penalty = this.scoreSystem.wrongTool();
      eventBus.emit('coins:changed', { coins: this.scoreSystem.coins });
      bed.reject();
      this.floatText(bed.x, bed.y - 100, `-${penalty}`, CSS.coral);
      audio.play('wrong', 0.6);
      haptics.error();
      this.showHint('That tool does not match this patient.');
      return;
    }
    const need = NEEDS[needKind];
    this.tray.hide();
    const record = this.records.get(pet.patientId);
    this.treatment = new TreatmentOverlay(
      this,
      need,
      () => this.completeTreatment(bed, needKind),
      pet.kind,
      this.toolSpeed,
    );
    this.treatmentPatientId = pet.patientId;
    if (record) record.customer.pausePatience();
    audio.play('pick', 0.5);
  }

  private completeTreatment(bed: Bed, need: NeedKind): void {
    const pet = bed.currentPet;
    this.treatment = null;
    this.treatmentPatientId = null;
    if (!pet || this.ended) return;
    const record = this.records.get(pet.patientId);
    if (!record) return;
    const cured = pet.completeNeed(need);
    record.customer.markNeedDone(need);
    if (cured) {
      this.curePatient(bed, record);
      return;
    }
    record.customer.resumePatience();
    this.floatText(bed.x, bed.y - 100, 'Nice!', CSS.green);
    this.time.delayedCall(320, () => {
      if (this.ended || bed.isFree || this.treatment) return;
      if (record.customer.patienceLeft > 0) this.openTrayFor(bed);
    });
  }

  private curePatient(bed: Bed, record: PatientRecord): void {
    if (!record.pet) return;
    const pet = record.pet;
    const customer = record.customer;
    customer.pausePatience();
    customer.disableInteractive();
    const elapsed = record.placedAt ? (this.time.now - record.placedAt) / 1000 : 0;
    const quick = elapsed > 0 && elapsed < FAST_CURE_SECONDS;
    const customerConfig = getCustomer(customer.customerId);
    const reward = this.scoreSystem.cure(
      customerConfig.baseReward.coins,
      customerConfig.baseReward.score,
      record.needsTotal,
      quick,
    );

    eventBus.emit('coins:changed', { coins: this.scoreSystem.coins });
    eventBus.emit('score:changed', { score: this.scoreSystem.score });
    eventBus.emit('combo:changed', { combo: reward.combo, reset: false });
    eventBus.emit('pet:cured', {
      petId: pet.patientId,
      coins: reward.coins,
      score: reward.score,
    });

    customer.celebrate();
    pet.celebrate();
    bed.clear();
    this.tray.hide();
    this.selectedBed = null;
    this.records.delete(record.id);
    audio.play('cure', 0.7);
    audio.play('coin', 0.45);
    haptics.success();
    this.coinBurst(bed.x, bed.y - 60, reward.coins);
    this.floatText(bed.x, bed.y - 130, `+${reward.score}`, CSS.ink);
    if (quick) this.floatText(bed.x + 60, bed.y - 170, 'FAST!', CSS.blue);

    this.time.delayedCall(260, () => {
      pet.fadeOut(() => pet.destroy());
      customer.leave(720);
      this.customers = this.customers.filter((item) => item !== customer);
    });

    this.time.delayedCall(900, () => {
      if (this.ended) return;
      if (goalReached(this.level, this.scoreSystem.cured, this.scoreSystem.score)) {
        this.finish(true);
      }
    });
  }

  private onPatientAngry(customer: Customer): void {
    const record = [...this.records.values()].find((item) => item.customer === customer);
    customer.angrier();
    if (record) {
      if (record.pet && this.heldPet === record.pet) {
        this.heldPet.destroy();
        this.heldPet = null;
        this.heldFrom = null;
        this.heldPointerId = null;
        record.pet = null;
      }
      if (record.bed) {
        const bed = record.bed;
        // Only close UI that belongs to THIS patient; another patient may be
        // mid-treatment or have the tray open on a different bed.
        if (this.treatment && this.treatmentPatientId === record.id) {
          this.treatment.cancel();
          this.treatment = null;
          this.treatmentPatientId = null;
        }
        if (this.tray.isOpen && this.selectedBed === bed) this.tray.hide();
        const pet = record.pet;
        if (pet && pet.active) pet.fadeOut(() => pet.destroy());
        bed.clear();
        if (this.selectedBed === bed) this.selectedBed = null;
      }
      this.records.delete(record.id);
    }
    this.customers = this.customers.filter((item) => item !== customer);
    const hearts = this.scoreSystem.loseHeart();
    this.scoreSystem.resetCombo();
    eventBus.emit('hearts:changed', { hearts });
    eventBus.emit('combo:changed', { combo: 0, reset: true });
    eventBus.emit('customer:angry', {
      petId: record?.id ?? 0,
      heartsLost: 1,
      comboReset: true,
    });
    this.floatText(customer.x, 430, '-1 heart', CSS.red);
    audio.play('heart-lost', 0.75);
    haptics.error();
    customer.leave(600);
    if (hearts <= 0) {
      this.finish(false, 'hearts');
    }
  }

  private updateHudState(): void {
    eventBus.emit('coins:changed', { coins: this.scoreSystem.coins });
    eventBus.emit('score:changed', { score: this.scoreSystem.score });
    eventBus.emit('hearts:changed', { hearts: this.scoreSystem.hearts });
    eventBus.emit('timer:tick', { secondsRemaining: this.levelSystem.secondsLeft });
  }

  private emitHudState(): void {
    this.updateHudState();
    eventBus.emit('combo:changed', { combo: 0, reset: true });
  }

  private finish(success: boolean, reason: 'time' | 'hearts' = 'time'): void {
    if (this.ended) return;
    this.ended = true;
    this.running = false;
    this.spawnSystem.stop();
    this.levelSystem.stop();
    this.treatment?.cancel();
    this.treatment = null;
    this.treatmentPatientId = null;
    if (this.tray.isOpen) this.tray.hide();
    this.selectedBed = null;
    if (this.heldPet) {
      this.heldPet.destroy();
      this.heldPet = null;
    }
    this.input.setDefaultCursor('default');

    const result: LevelResult = buildLevelResult({
      level: this.level,
      success,
      score: this.scoreSystem.score,
      hearts: this.scoreSystem.hearts,
      curedPets: this.scoreSystem.cured,
      coinsEarned: this.scoreSystem.coins,
      timeRemaining: this.levelSystem.secondsLeft,
    });

    if (success) {
      audio.play('level-complete', 0.8);
      haptics.success();
      new Celebration(this, {
        stars: result.starRating,
        curedPets: result.curedPets,
        coinsEarned: result.coinsEarned,
      });
      eventBus.emit('level:completed', { result });
    } else {
      audio.play('game-over', 0.6);
      haptics.warning();
      eventBus.emit('level:failed', { reason, result });
    }

    this.time.delayedCall(success ? 2200 : 700, () => {
      this.scene.stop(SCENES.Hud);
      this.scene.start(SCENES.Result, { result, levelId: this.level.id });
    });
  }

  private coinBurst(x: number, y: number, amount: number): void {
    const coin = this.add.image(x, y, 'ui-coin').setDepth(130).setScale(0.7);
    const label = this.add
      .text(x + 26, y, `+${amount}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#c58a14',
      })
      .setOrigin(0, 0.5)
      .setDepth(130);
    this.tweens.add({
      targets: [coin, label],
      y: y - 80,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => {
        coin.destroy();
        label.destroy();
      },
    });
    for (let i = 0; i < 6; i += 1) {
      const bit = this.add
        .image(x + Phaser.Math.Between(-20, 20), y, 'fx-sparkle')
        .setDepth(129)
        .setScale(0.5)
        .setTint(0xffd166);
      this.tweens.add({
        targets: bit,
        x: bit.x + Phaser.Math.Between(-70, 70),
        y: bit.y - Phaser.Math.Between(30, 90),
        alpha: 0,
        angle: Phaser.Math.Between(-90, 90),
        duration: Phaser.Math.Between(500, 800),
        onComplete: () => bit.destroy(),
      });
    }
  }

  private floatText(x: number, y: number, text: string, color: string): void {
    const label = this.add
      .text(x, y, text, {
        fontFamily: FONT_FAMILY,
        fontSize: '26px',
        fontStyle: 'bold',
        color,
        stroke: '#ffffff',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(140);
    this.tweens.add({
      targets: label,
      y: y - 55,
      alpha: 0,
      duration: 900,
      ease: 'Quad.easeOut',
      onComplete: () => label.destroy(),
    });
  }

  private showHint(message: string): void {
    if (this.hintText) {
      this.hintText.setText(message);
      this.hintText.setAlpha(1);
      this.tweens.killTweensOf(this.hintText);
    } else {
      this.hintText = this.add
        .text(360, 232, message, {
          fontFamily: FONT_FAMILY,
          fontSize: '21px',
          fontStyle: 'bold',
          color: CSS.inkSoft,
          backgroundColor: '#fffdf9',
          padding: { x: 18, y: 9 },
        })
        .setOrigin(0.5)
        .setDepth(120)
        .setAlpha(1);
    }
    this.tweens.add({
      targets: this.hintText,
      alpha: 0,
      delay: 2800,
      duration: 450,
    });
  }

  private hideHint(): void {
    if (!this.hintText) return;
    this.tweens.killTweensOf(this.hintText);
    this.tweens.add({ targets: this.hintText, alpha: 0, duration: 200 });
  }

  private handleHidden(): void {
    if (this.ended || !this.running) return;
    if (this.scene.isPaused()) return;
    if (this.scene.isActive(SCENES.Pause)) return;
    this.scene.launch(SCENES.Pause, { auto: true });
    this.scene.pause();
  }

  private handleShutdown(): void {
    this.input.off('pointerdown', this.handleBedPointer, this);
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    this.game.events.off(Phaser.Core.Events.HIDDEN, this.handleHidden, this);
    this.events.off(Phaser.Scenes.Events.SHUTDOWN, this.handleShutdown, this);
  }
}







