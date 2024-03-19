export type TelegramUpdateMessageType = {
  message: {
    from: {
      id: number;
      first_name: string;
      last_name: string;
    };
    text: string;
  };
};
