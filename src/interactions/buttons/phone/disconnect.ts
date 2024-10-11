import { Button } from 'classes/button';

import { handlePhoneDisconnect } from 'utils/phone';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Fun,
  customId: 'button-phone-disconnect',
  async execute({ client, interaction }) {
    handlePhoneDisconnect({ client, interaction });
  }
});
