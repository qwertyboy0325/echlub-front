
export class LoginUserCommand {
    constructor(
        public readonly email: string,
        public readonly password: string
    ) { }
}