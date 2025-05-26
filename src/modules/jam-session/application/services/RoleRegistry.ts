import { injectable } from 'inversify';
import { RoleVO } from '../../domain/value-objects/RoleVO';

/**
 * 角色註冊服務
 * 管理可用的角色配置
 */
@injectable()
export class RoleRegistry {
  private readonly roles: RoleVO[];

  constructor() {
    // 初始化預設角色
    this.roles = [
      RoleVO.create('drummer', 'Drummer', '#FF5733', true),
      RoleVO.create('guitarist', 'Guitarist', '#33FF57', true),
      RoleVO.create('bassist', 'Bassist', '#3357FF', true),
      RoleVO.create('keyboardist', 'Keyboardist', '#FF33F5', true)
    ];
  }

  /**
   * 獲取所有可用角色
   */
  getAllRoles(): ReadonlyArray<RoleVO> {
    return this.roles;
  }

  /**
   * 根據 ID 獲取角色
   * @param id 角色 ID
   */
  getRoleById(id: string): RoleVO | undefined {
    return this.roles.find(role => role.id === id);
  }

  /**
   * 檢查角色 ID 是否有效
   * @param id 角色 ID
   */
  isValidRoleId(id: string): boolean {
    return this.roles.some(role => role.id === id);
  }

  /**
   * 獲取唯一角色列表
   */
  getUniqueRoles(): ReadonlyArray<RoleVO> {
    return this.roles.filter(role => role.isUnique());
  }

  /**
   * 獲取非唯一角色列表
   */
  getNonUniqueRoles(): ReadonlyArray<RoleVO> {
    return this.roles.filter(role => !role.isUnique());
  }
} 