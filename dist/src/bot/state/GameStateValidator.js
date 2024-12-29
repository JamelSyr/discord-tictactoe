"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class GameStateValidator {
    constructor(manager) {
        this.manager = manager;
    }
    get config() {
        return this.manager.bot.configuration;
    }
    get cooldownEndTimes() {
        return this.manager.memberCooldownEndTimes;
    }
    isInteractionValid(tunnel) {
        return this.isMessagingAllowed(tunnel) && this.isMemberAllowed(tunnel.author);
    }
    isNewGamePossible(tunnel, invited) {
        return (!this.manager.gameboards.some(gameboard => [tunnel.author, invited].some(entity => entity && gameboard.entities.includes(entity))) &&
            (this.config.simultaneousGames ||
                !this.manager.gameboards.some(gameboard => gameboard.tunnel.channel === tunnel.channel)));
    }
    isMessagingAllowed(tunnel) {
        return (this.hasPermissionsInChannel(tunnel) &&
            (!this.config.allowedChannelIds ||
                this.config.allowedChannelIds.length === 0 ||
                this.config.allowedChannelIds.includes(tunnel.channel.id)));
    }
    hasPermissionsInChannel(tunnel) {
        const perms = [...GameStateValidator.PERM_LIST];
        if (this.config.gameBoardReactions) {
            perms.push(GameStateValidator.PERM_ADD_REACTIONS);
        }
        const allowed = tunnel.channel.guild.members.me?.permissionsIn(tunnel.channel)?.has(perms) ?? false;
        if (!allowed) {
            console.error(`Cannot operate because of a lack of permissions in the channel #${tunnel.channel.name}`);
        }
        return allowed;
    }
    isMemberAllowed(member) {
        return this.isMemberAllowedByRole(member) && this.isMemberAllowedByCooldown(member);
    }
    isMemberAllowedByRole(member) {
        return (!this.config.allowedRoleIds ||
            this.config.allowedRoleIds.length == 0 ||
            member.permissions.has('Administrator') ||
            member.roles.cache.some(role => this.config.allowedRoleIds.includes(role.id)));
    }
    isMemberAllowedByCooldown(member) {
        return (!this.config.requestCooldownTime ||
            this.config.requestCooldownTime === 0 ||
            !this.cooldownEndTimes.has(member.id) ||
            this.cooldownEndTimes.get(member.id) < Date.now());
    }
}
GameStateValidator.PERM_LIST = [
    'ReadMessageHistory',
    'SendMessages',
    'ViewChannel'
];
GameStateValidator.PERM_ADD_REACTIONS = 'AddReactions';
exports.default = GameStateValidator;
