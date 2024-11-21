import { axe, boot, chocolate, cookie, diamond, fish, fishingRod, flower, marriageRing, pickaxe, rock, scrap, shield, sword, wood } from 'constants/items';

export const defaultShop = [
  {
    ...pickaxe,
    buyPrice: 100,
    sellPrice: 50
  },
  {
    ...fishingRod,
    buyPrice: 100,
    sellPrice: 50
  },
  {
    ...axe,
    buyPrice: 100,
    sellPrice: 50
  },
  {
    ...sword,
    buyPrice: 100,
    sellPrice: 50
  },
  {
    ...shield,
    buyPrice: 100,
    sellPrice: 50
  },
  {
    ...marriageRing,
    buyPrice: 1000,
    sellPrice: 500
  },
  {
    ...diamond,
    buyPrice: 500,
    sellPrice: 250
  },
  {
    ...wood,
    buyPrice: 10,
    sellPrice: 5
  },
  {
    ...rock,
    buyPrice: 10,
    sellPrice: 5
  },
  {
    ...fish,
    buyPrice: 10,
    sellPrice: 5
  },
  {
    ...boot,
    buyPrice: 10,
    sellPrice: 5
  },
  {
    ...scrap,
    buyPrice: 10,
    sellPrice: 5
  },
  {
    ...flower,
    buyPrice: 10,
    sellPrice: 5
  },
  {
    ...chocolate,
    buyPrice: 10,
    sellPrice: 5
  },
  {
    ...cookie,
    buyPrice: 10,
    sellPrice: 5
  }
];
