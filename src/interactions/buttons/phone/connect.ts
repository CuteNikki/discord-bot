import { Button } from 'classes/button';

import { handlePhoneConnection } from 'utils/phone';

export default new Button({
  customId: 'button-phone-connect',
  async execute({ client, interaction }) {
    handlePhoneConnection({ client, interaction });
  }
});
