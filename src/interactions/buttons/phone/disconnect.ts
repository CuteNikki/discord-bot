import { Button } from 'classes/button';

import { handlePhoneDisconnect } from 'utils/phone';

export default new Button({
  customId: 'button-phone-disconnect',
  async execute({ client, interaction }) {
    handlePhoneDisconnect({ client, interaction });
  }
});
