import { Button } from 'classes/button';

import { handlePhoneConnection } from 'utils/phone';

import { ModuleType } from 'types/interactions';

export default new Button({
  module: ModuleType.Fun,
  customId: 'button-phone-connect',
  async execute({ client, interaction }) {
    handlePhoneConnection({ client, interaction });
  }
});
