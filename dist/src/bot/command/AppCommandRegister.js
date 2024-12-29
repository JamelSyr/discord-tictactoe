"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const localize_1 = __importDefault(require("../../i18n/localize"));
const discord_js_1 = require("discord.js");
class AppCommandRegister {
    constructor(commandManager, name, optionName) {
        this.commandManager = commandManager;
        this.name = name;
        this.optionName = optionName;
    }
    async handleDeployMessage(message) {
        if (message.guild &&
            message.member &&
            message.client.user &&
            message.mentions.has(message.client.user) &&
            message.member.permissions.has('Administrator')) {
            const words = message.content.split(' ');
            if (words.length === 2) {
                if (words.includes('tttdeploy')) {
                    await this.registerInGuild(message.guild.id);
                    await message.reply(`Command /${this.name} has been registered.`);
                }
                else if (words.includes('tttdelete')) {
                    const executed = await this.deleteInGuild(message.guild.id);
                    if (executed) {
                        await message.reply(`Command /${this.name} has been unregistered.`);
                    }
                    else {
                        await message.reply(`Command /${this.name} not found.`);
                    }
                }
            }
        }
    }
    async registerInGuild(guildId) {
        await this.commandManager.create({
            name: this.name,
            description: localize_1.default.__('command.description'),
            options: [
                {
                    type: discord_js_1.ApplicationCommandOptionType.User,
                    name: this.optionName,
                    description: localize_1.default.__('command.option-user')
                }
            ]
        }, guildId);
    }
    async deleteInGuild(guildId) {
        const commands = await this.commandManager.fetch({ guildId });
        const command = commands?.find(cmd => cmd.name === this.name);
        if (command) {
            await this.commandManager.delete(command.id, guildId);
            return true;
        }
        else {
            return false;
        }
    }
}
exports.default = AppCommandRegister;
