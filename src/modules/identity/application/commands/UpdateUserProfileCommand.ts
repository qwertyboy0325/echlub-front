import { UpdateUserDTO } from '../dtos/UserDTO';

export class UpdateUserProfileCommand {
  constructor(
    public readonly userData: UpdateUserDTO
  ) {}
} 
