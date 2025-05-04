export class ChangePasswordCommand {
  constructor(
    public readonly oldPassword: string,
    public readonly newPassword: string
  ) {}
} 