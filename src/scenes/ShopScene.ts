import Phaser from 'phaser';
import { SCENES } from '@/config/sceneKeys';
import { UPGRADE_LIST } from '@/config/upgrades';
import type { PetKind, UpgradeConfig } from '@/contracts/types';
import { audio } from '@/services/AudioManager';
import { haptics } from '@/services/HapticsService';
import { save } from '@/services/SaveService';
import { Button } from '@/ui/Button';
import { COLORS, CSS, FONT_FAMILY, textStyle } from '@/ui/theme';

type TabId = 'clinic' | 'care' | 'pets' | 'decor';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'clinic', label: 'CLINIC' },
  { id: 'care', label: 'CARE' },
  { id: 'pets', label: 'PETS' },
  { id: 'decor', label: 'DECOR' },
];

export class ShopScene extends Phaser.Scene {
  private tab: TabId = 'clinic';
  private list!: Phaser.GameObjects.Container;
  private coinLabel!: Phaser.GameObjects.Text;
  private tabButtons = new Map<TabId, Button>();

  constructor() {
    super(SCENES.Shop);
  }

  create(): void {
    this.cameras.main.fadeIn(200, 255, 243, 224);
    this.add.image(360, 640, 'bg-clinic').setDepth(0);
    this.add.rectangle(360, 640, 720, 1280, 0xfff8ee, 0.42).setDepth(1);
    this.drawHeader();
    this.list = this.add.container(0, 0).setDepth(5);
    this.buildTabButtons();
    this.renderList();
    audio.bind(this);
    const settings = save.getSettings();
    audio.setSettings(settings.musicEnabled, settings.sfxEnabled);
  }

  private drawHeader(): void {
    const g = this.add.graphics().setDepth(2);
    g.fillStyle(0xfffdf9, 0.97);
    g.fillRoundedRect(0, -20, 720, 226, 34);
    g.fillStyle(COLORS.pink, 0.85);
    g.fillRoundedRect(0, 182, 720, 14, 0);

    new Button(this, 58, 56, {
      label: '',
      width: 62,
      height: 62,
      radius: 22,
      color: COLORS.lilac,
      icon: 'icon-arrow-left',
      iconScale: 0.8,
      onClick: () => this.goBack(),
    }).setDepth(4);

    this.add
      .text(360, 54, 'CLINIC SHOP', {
        fontFamily: FONT_FAMILY,
        fontSize: '38px',
        fontStyle: 'bold',
        color: CSS.ink,
        letterSpacing: 1,
      })
      .setOrigin(0.5)
      .setDepth(4);

    const chip = this.add.graphics().setDepth(3);
    chip.fillStyle(COLORS.shadow, 0.1);
    chip.fillRoundedRect(536, 28, 154, 56, 28);
    chip.fillStyle(COLORS.panel, 1);
    chip.fillRoundedRect(536, 24, 154, 56, 28);
    this.add.image(566, 52, 'ui-coin').setDisplaySize(34, 34).setDepth(4);
    this.coinLabel = this.add
      .text(588, 52, String(save.getCoins()), textStyle(25, CSS.ink))
      .setOrigin(0, 0.5)
      .setDepth(4);

    this.add
      .text(360, 120, 'Upgrades stay with you on every level.', {
        fontFamily: FONT_FAMILY,
        fontSize: '18px',
        color: CSS.inkSoft,
      })
      .setOrigin(0.5)
      .setDepth(4);
  }

  private buildTabButtons(): void {
    TABS.forEach((tab, index) => {
      const button = new Button(this, 125 + index * 156, 232, {
        label: tab.label,
        width: 146,
        height: 54,
        radius: 20,
        color: tab.id === this.tab ? COLORS.mint : COLORS.panelAlt,
        textColor: tab.id === this.tab ? CSS.white : CSS.inkSoft,
        fontSize: 19,
        onClick: () => {
          if (this.tab === tab.id) return;
          this.tab = tab.id;
          audio.play('tap', 0.35);
          this.tabButtons.forEach((value, id) => {
            value.setButtonColor(id === this.tab ? COLORS.mint : COLORS.panelAlt);
            value.setTextColor(id === this.tab ? CSS.white : CSS.inkSoft);
          });
          this.renderList();
        },
      });
      button.setDepth(4);
      this.tabButtons.set(tab.id, button);
    });
  }

  private itemsForTab(): UpgradeConfig[] {
    switch (this.tab) {
      case 'clinic':
        return UPGRADE_LIST.filter(
          (item) => item.type === 'maxBeds' || item.type === 'maxWaitingSlots',
        );
      case 'care':
        return UPGRADE_LIST.filter(
          (item) =>
            item.type === 'patience' || item.type === 'toolSpeed' || item.type === 'coinBonus',
        );
      case 'pets':
        return UPGRADE_LIST.filter((item) => item.type === 'petUnlock');
      case 'decor':
        return UPGRADE_LIST.filter((item) => item.type === 'decoration');
    }
  }

  private renderList(): void {
    this.list.removeAll(true);
    const items = this.itemsForTab();
    items.forEach((item, index) => {
      const y = 344 + index * 138;
      this.drawCard(item, y, index);
    });
    if (this.tab === 'pets') {
      const note = this.add
        .text(360, 1120, 'New pets start visiting after you unlock them.', {
          fontFamily: FONT_FAMILY,
          fontSize: '18px',
          color: CSS.inkSoft,
        })
        .setOrigin(0.5);
      this.list.add(note);
    }
  }

  private drawCard(item: UpgradeConfig, y: number, index: number): void {
    const owned = save.hasUpgrade(item.id);
    const affordable = save.getCoins() >= item.cost;
    const card = this.add.container(360, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.shadow, 0.12);
    bg.fillRoundedRect(-312, -58, 624, 128, 26);
    bg.fillStyle(owned ? 0xeaf7f2 : COLORS.panel, 1);
    bg.fillRoundedRect(-312, -62, 624, 128, 26);
    bg.fillStyle(0xffffff, 0.3);
    bg.fillRoundedRect(-294, -54, 588, 10, 5);
    card.add(bg);

    const iconBg = this.add.circle(-254, 0, 40, owned ? COLORS.mint : COLORS.pinkLight);
    const icon = this.add.image(-254, -2, this.iconFor(item)).setDisplaySize(52, 52);
    card.add([iconBg, icon]);

    const name = this.add
      .text(-194, -34, item.name, {
        fontFamily: FONT_FAMILY,
        fontSize: '24px',
        fontStyle: 'bold',
        color: CSS.ink,
      })
      .setOrigin(0, 0.5);
    const desc = this.add
      .text(-194, 4, item.description, {
        fontFamily: FONT_FAMILY,
        fontSize: '16px',
        color: CSS.inkSoft,
        wordWrap: { width: 370 },
      })
      .setOrigin(0, 0);
    card.add([name, desc]);

    if (owned) {
      const check = this.add.image(260, 0, 'ui-check').setDisplaySize(42, 42);
      const label = this.add
        .text(286, 0, 'OWNED', {
          fontFamily: FONT_FAMILY,
          fontSize: '17px',
          fontStyle: 'bold',
          color: CSS.green,
        })
        .setOrigin(0, 0.5);
      card.add([check, label]);
    } else {
      const buy = new Button(this, 258, 2, {
        label: String(item.cost),
        width: 118,
        height: 58,
        radius: 20,
        color: affordable ? COLORS.yellow : 0xd5c9c0,
        textColor: affordable ? CSS.ink : CSS.inkSoft,
        icon: 'ui-coin',
        iconScale: 0.42,
        fontSize: 20,
        onClick: () => this.buy(item, card),
      });
      card.add(buy);
    }

    card.setAlpha(0);
    card.setY(y + 16);
    this.tweens.add({
      targets: card,
      alpha: 1,
      y,
      delay: index * 45,
      duration: 220,
      ease: 'Sine.easeOut',
    });
    this.list.add(card);
  }

  private iconFor(item: UpgradeConfig): string {
    if (item.type === 'maxBeds') return 'bed-0';
    if (item.type === 'maxWaitingSlots') return 'chair';
    if (item.type === 'patience') return 'icon-music-on';
    if (item.type === 'toolSpeed') return 'tool-thermometer';
    if (item.type === 'coinBonus') return 'ui-coin';
    if (item.type === 'petUnlock') {
      const pet = item.effect.pet as PetKind | undefined;
      if (pet && this.textures.exists(`portrait-${pet}`)) return `portrait-${pet}`;
      if (pet) return `pet-${pet}-happy`;
    }
    if (item.type === 'decoration') {
      return item.id === 'decor-plant' ? 'plant' : 'rug';
    }
    return 'ui-star';
  }

  private buy(item: UpgradeConfig, card: Phaser.GameObjects.Container): void {
    if (save.hasUpgrade(item.id)) return;
    if (save.getCoins() < item.cost) {
      audio.play('wrong', 0.5);
      haptics.warning();
      this.tweens.add({
        targets: card,
        x: 368,
        duration: 45,
        yoyo: true,
        repeat: 3,
        onComplete: () => card.setX(360),
      });
      this.showToast('Not enough coins yet!');
      return;
    }
    const bought = save.purchaseUpgrade(item.id, item.cost);
    if (!bought) return;
    if (item.type === 'petUnlock') {
      const pet = item.effect.pet as PetKind | undefined;
      if (pet) save.unlockPet(pet, 0);
    }
    audio.play('coin', 0.7);
    audio.play('sparkle', 0.35);
    haptics.success();
    this.coinLabel.setText(String(save.getCoins()));
    this.showToast(`${item.name} unlocked!`);
    this.renderList();
  }

  private showToast(message: string): void {
    const toast = this.add
      .text(360, 1170, message, {
        fontFamily: FONT_FAMILY,
        fontSize: '22px',
        fontStyle: 'bold',
        color: CSS.white,
        backgroundColor: '#4a3b53',
        padding: { x: 20, y: 10 },
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0);
    this.tweens.add({
      targets: toast,
      alpha: 1,
      y: 1145,
      duration: 180,
      yoyo: true,
      hold: 950,
      onComplete: () => toast.destroy(),
    });
  }

  private goBack(): void {
    audio.play('tap', 0.4);
    this.cameras.main.fadeOut(150, 255, 243, 224);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start(SCENES.Menu);
    });
  }
}

