import { EmbedColor } from './types';
export default interface InteractionConfig {
    allowedChannelIds?: string[];
    allowedRoleIds?: string[];
    embedColor?: EmbedColor;
    requestCooldownTime?: number;
    requestExpireTime?: number;
    requestReactions?: boolean;
    simultaneousGames?: boolean;
}
