    const Discord = require('discord.js');
const { inspect } = require('util');
const fs = require('fs')
const sqlite3 = require('sqlite3').verbose();

let config = require('./settings.json');
let servers = require('./servers.json');
const { on, execPath } = require('process');
const { stringify } = require('querystring');

const client = new Discord.Client();

let token = config.token;
let prefix = config.prefix;
let version = config.version;
let ownerid = '535402224373989396';
let news = config.news;
let botColor = 0x507edb;

let db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to database!');
    });

client.on('ready', () => {
    console.log("Bot actived");
    client.user.setPresence({
        status: 'online',
        activity: {
            type: 'PLAYING',
            name: `${prefix}хелп`,
        },
    });
})

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function emb_error(name, text, author_url, message){
    let itit = 0;
    const err = new Discord.MessageEmbed()
    .setTitle(name)
    .setDescription(text)
    .setColor(botColor)
    .setAuthor('error', author_url)
    .setFooter("{} - обяз. аргумент, <> - необяз.", client.user.avatarURL())
    message.channel.send(err).then(msg => {
        msg.react('❌').then(r =>{
            if (itit != 0) return;
            itit++;
            const reactsfilt = (reaction, user) => reaction.emoji.name === '❌' && user.id === message.author.id;
            const reacts = msg.createReactionCollector(reactsfilt, {time: 60000});
            reacts.on('collect', r =>{
                msg.delete();
            });
        })
        })
};

let emojiscds = {
    '^crystal^' : '798975013801689108',
    '^book^' : '798975133993664522',
    '^purplecry^' : '798975169489797120',
    '^group^' : '798933227867209808'
}
function okey(react, msg, userid){
    msg.react(react).then(r =>{
        let itit = 0;
        const reactsfilt = (reaction, user) => reaction.emoji.name === react && user.id === userid && reaction.message.id === msg.id;
        const reacts = msg.createReactionCollector(reactsfilt, {time: 60000});
        reacts.on('collect', r =>{
            if (itit != 0) return;
            itit++;
            msg.delete();
        });
    })
}
//GUILD
client.on('message', async message =>{
    let guildid = message.guild.id;
    let query = `SELECT * FROM servers WHERE id = ?`
    db.get(query, [guildid], (err, row) =>{
        if(err){
            console.log(err);
            return;
        }
        if(row == undefined){
            let filtr = 'off'; let logs = 'off'; let log_chan = 'id'
            insert = db.prepare(`INSERT INTO servers VALUES(?, ?, ?, ?)`);
            insert.run(guildid, filtr, logs, log_chan, err =>{
                if(err){
                    console.log(err);
                    return;
                }
            });
            insert.finalize();
            return;
        }
    if(message.author.bot) return;
    if (row.filtr == 'on'){
        for (let i = 0; i < servers.bad_words.length; i++){
            if(message.content.toLocaleLowerCase().includes(servers.bad_words[i])){
                const bad_word = new Discord.MessageEmbed()
                .setTitle('В вашем сообщение присуствует нецензурная лексика')
                .setDescription(`Слово: ${servers.bad_words[i]}`)
                .setColor(botColor)
                .setAuthor('Модерация', client.user.avatarURL())
                message.author.send(bad_word)
                message.delete();
                break;
            }
        }
        let txts = message.content.split('');
        let rgs = 0;
        for (let i = 0; i < txts.length; i++){
            if (txts[i] == txts[i].toUpperCase()){
                rgs++;
            }
            if (rgs >= 4){
                const bad_word = new Discord.MessageEmbed()
                .setTitle('Упсс... Вы написали слово капсом....')
                .setDescription(`Сообщение удалено...`)
                .setColor(botColor)
                .setAuthor('Модерация', client.user.avatarURL())
                message.author.send(bad_word)
                message.delete();
                break;
            }
        }
    }
    })
})

client.on('messageDelete', async message =>{
    if (message.author.bot) return;
    if (message.content.startsWith(prefix)) return;
    let query = `SELECT * FROM servers WHERE id = ?`
    db.get(query, [message.guild.id], (err, row) =>{
    let guildid = message.guild.id;
    if(row.logs == 'on'){
    const channel = client.channels.cache.get(row.log_channel);
    const deletes = new Discord.MessageEmbed()
    .setTitle('Сообщение было удалено')
    .setColor(botColor)
    .addFields({name: 'Текст сообщения:', value: message.content},
                {name: 'Канал:', value: message.channel},
                {name: 'Автор:', value: message.member})
    channel.send(deletes)
    }
});
})

client.on('messageUpdate', async (oldMessage, newMessage) =>{
    if (newMessage.author.bot) return;
    let query = `SELECT * FROM servers WHERE id = ?`
    db.get(query, [newMessage.guild.id], (err, row) =>{
    if(row.logs == 'on'){
    const channel = client.channels.cache.get(row.log_channel);
    const editemb = new Discord.MessageEmbed()
    .setTitle('Сообщение было отредактировано')
    .setColor(botColor)
    .addFields({name: 'До редактирования:', value: oldMessage.content},
                {name: 'После редактирования:', value: newMessage.content},
                {name: 'Канал:', value: newMessage.channel},
                {name: 'Автор:', value: newMessage.author})
    channel.send(editemb);
    }
});
});

client.on('guildMemberAdd', async member =>{
    let query = `SELECT * FROM servers WHERE id = ?`
    db.get(query, [member.guild.id], (err, row) =>{
    if(row.logs == 'on'){
    const channel = client.channels.cache.get(row.log_channel);
    const membaemb = new Discord.MessageEmbed()
    .setTitle("Присоиденился новый участник!")
    .setColor(botColor)
    .addFields({name: 'Участник:', value: member.user},
                {name: 'Присоиденился в:', value: member.joinedAt})
    channel.send(membaemb)    
    }
})
})

//MEMBER
client.on('message', async message => {
    let userid = message.author.id;
    if (message.author.bot) return;
    let querys = `SELECT * FROM gusers WHERE id_u = ? AND id_g = ?`
    db.get(querys, [userid, message.guild.id], (err, rowm) => {
        if(err){
            console.log(err);
            return;
        }
        if(rowm == undefined){
           let mutee = 0;
            inserts = db.prepare(`INSERT INTO gusers VALUES(?, ?, ?)`);
            inserts.run(userid, message.guild.id, mutee, err => {
                if (err){
                    console.log(err);
                    return;
                };
            });
            inserts.finalize();
            return;
        }
        if (rowm.mute == 1){
            message.delete();
            return;
        }
    });
    let query = `SELECT * FROM users WHERE id = ?`
    db.get(query, [userid], (err, row) => {
        if(err){
            console.log(err);
            return;
        }
        if(row == undefined){
            let cash = 0; let lvl = 1; let exp = 1; 
            insert = db.prepare(`INSERT INTO users VALUES(?, ?, ?, ?)`);
            insert.run(userid, cash, lvl, exp, err => {
                if (err){
                    console.log(err);
                    return;
                };
            });
            insert.finalize();
            return;
        }else{
            let cash_plus = 0;
            if (random(0, 100) >= 80) cash_plus++;
            let cash_new = row.cash + cash_plus;
            let exp_new = row.exp + 1;
            db.run(`UPDATE users SET exp = ?, cash = ? WHERE id = ?`, [exp_new, cash_new, userid]);
            if (exp_new >= 200*row.lvl){
                let lvl_new = row.lvl + 1;
                let exp_newn = 0;
                db.run(`UPDATE users SET lvl = ?, exp = ? WHERE id = ?`, [lvl_new, exp_newn, userid]);
            };
        }
        let query = `SELECT * FROM preds WHERE id_u = ? AND id_g = ?`
        db.get(query, [userid, message.channel.guild.id], (err, row) => {
            if(err){
                console.log(err);
                return;
            }
            if(row == undefined){
                let pred = 0; let predr = 'none';
                insert = db.prepare(`INSERT INTO preds VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
                insert.run(userid, message.channel.guild.id, pred, predr, pred, predr, pred, predr, pred, predr, pred, predr, err => {
                    if (err){
                        console.log(err);
                        return;
                    };
                });
                insert.finalize();
                return;
            }
        });
    });
    if (!message.content.startsWith(prefix)) return;
    const args = message.content.slice(prefix.length).trim().split(' ');
    let command = args.shift().toLowerCase();
    if(command == "хелп"){
        let page = 0;
        message.delete();
        const inf = new Discord.MessageEmbed()
        .setTitle(":receipt:Информативные")
        .setColor(botColor)
        .setAuthor('{} - обяз. аргумент, <> - необяз.', message.author.avatarURL())
        .setDescription(
            "**Префикс:** . \n\
            `хелп`\n\
            `сервер`\n\
            `профиль` <участник> \n\
            `пинг`\n\
            `преды` <участник>\
        ")
        .setFooter("Cтраница 1", client.user.avatarURL())
        const moderator = new Discord.MessageEmbed()
        .setTitle(":tools:Модеративные команды")
        .setColor(botColor)
        .setAuthor('{} - обяз. аргумент, <> - необяз.', message.author.avatarURL())
        .setDescription("\
            **Префикс:** .\n\
            `кик` {участник} <причина>\n\
            `бан` {учатсник} {кол-во дней} <причина>\n\
            Если указать 'навсегда' вместо кол-во дней, участника забанят навсегда..\n\
            `мьют` {участник}\n\
            `размьют` {участник}\n\
        ")
        .setFooter("Cтраница 2", client.user.avatarURL())
        const moderator2 = new Discord.MessageEmbed()
        .setTitle(":tools:Модеративные команды")
        .setColor(botColor)
        .setDescription("\
            **Префикс:** . \n\
            `пред` {участник} {причина} \n\
            `разпред` {участник} {номер преда} \n\
            `модерация`  \n\
            `эмбед` '{заголовок}' '{описание}' '<подзаголовок>' \n\
        ")
        .setAuthor('{} - обяз. аргумент, <> - необяз.', message.author.avatarURL())
        .setFooter("Cтраница 3", client.user.avatarURL())
        const non = new Discord.MessageEmbed()
        .setTitle(":file_folder:Команды без категории")
        .setColor(botColor)
        .setDescription("\
            **Префикс:** . \n\
            `баг` {баг который вы нашли} \n\
            `идея` {ваша идея} \n\
            `с` {текст} \n\
            `эмодзи` \n\
        ")
        .setAuthor('{} - обяз. аргумент, <> - необяз.', message.author.avatarURL())
        .setFooter("Cтраница 4", client.user.avatarURL())
        let pages = [inf, moderator, moderator2, non]
        message.channel.send(inf).then(msg =>{
            msg.react('◀️').then(r =>{
                msg.react('▶️')
                const backfilt = (reaction, user) => reaction.emoji.name === '◀️' && user.id === userid;
                const forfilt = (reaction, user) => reaction.emoji.name === '▶️' && user.id === userid;

                const back = msg.createReactionCollector(backfilt, {time: 60000});
                const fors = msg.createReactionCollector(forfilt, {time: 60000});

                back.on('collect', r =>{
                    if (page == 0) return;
                    page--;
                    msg.edit(pages[page]);
                    r.users.remove(userid);
                });
                fors.on('collect', r =>{
                    if (page == 3) return;
                    page++;
                    msg.edit(pages[page]);
                    r.users.remove(userid);
                });
            });
        })
    }
    if(command == "кик"){
        let queryg = `SELECT * FROM servers WHERE id = ?`
        db.get(queryg, [message.guild.id], (err, row_g) =>{
            if(err){
                console.log(err);
                return;
            }
        const {member, mentions} = message
        if (member.hasPermission('ADMINISTRATOR') || member.hasPermission('KICK_MEMBERS')){
            const memb = message.mentions.users.first()
            if(memb){
                const target = message.guild.members.cache.get(memb.id)
                let reason = message.content.slice('.кик '.length + args[0].length).trim();
                if(reason.length <= 1){
                    reason = "Не указано";
                    target.kick(reason);
                }else{
                    target.kick(reason);
                }
                const kickem = new Discord.MessageEmbed()
                .setTitle('Был кикнут пользователь')
                .setColor(botColor)
                .addFields({name: "Модератор:", value: message.author},
                            {name: "Нарушитель:", value: args[0]},
                            {name: "Причина:", value: reason})
                .setAuthor("Модерация", client.user.avatarURL())
                message.delete();
                message.channel.send(kickem).then(msg =>{
                    okey('✅', msg, userid)
                });
                if (row_g.logs == 'on'){
                    const channel = client.channels.cache.get(row_g.log_channel)
                    channel.send(kickem);
                }
            }else{
                emb_error('Пользователь не найден', 'Пользователь не найден или не указан. \
                          Использование команды: .кик {участник} <причина>', message.member.user.avatarURL(), message)
            }
        }else{
            emb_error('Недостаточно прав', 'У вас недостаточно прав! \
                          Требуются права администратора, или же права на кик пользователя.', message.member.user.avatarURL(), message)
        }
        });
    }
    if(command == "бан"){
        let queryg = `SELECT * FROM servers WHERE id = ?`
        db.get(queryg, [message.guild.id], (err, row_g) =>{
            if(err){
                console.log(err);
                return;
            }
        const {member, mentions} = message
        if (member.hasPermission('ADMINISTRATOR') || member.hasPermission('BAN_MEMBERS')){
            const memb = message.mentions.users.first()
            if(memb){
                const target = message.guild.members.cache.get(memb.id)
                if(!args[1]){
                    emb_error('Время не указано', 'Время не указано!. \
                          Использование команды: .бан {участник} {кол-во дней (цифрой)} <причина> \n\
                          Если в количестве дней указать "навсегда" - пользователя забанит навсегда...', message.member.user.avatarURL(), message)
                    return;
                }
                let days = args[1]
                if (days.toLowerCase() == "навсегда"){
                    days = 0;
                }
                let reason = message.content.slice('.бан '.length + args[0].length + args[1].length).trim();
                if(reason.length <= 1){
                    reason = "Не указано";
                    target.ban({days: days, reason: reason});
                }else{
                    target.ban({days: days, reason: reason});
                }
                const banem = new Discord.MessageEmbed()
                .setTitle('Был забанен пользователь')
                .setColor(botColor)
                .addFields({name: "Модератор:", value: message.author},
                            {name: "Нарушитель:", value: args[0]},
                            {name: "Время", value: args[1]},
                            {name: "Причина:", value: reason})
                .setAuthor("Модерация", client.user.avatarURL())
                message.delete();
                message.channel.send(banem).then(msg =>{
                    okey('✅', msg, userid)
                });
                if (row_g.logs == 'on'){
                    const channel = client.channels.cache.get(row_g.log_channel)
                    channel.send(banem);
                }
            }else{
                emb_error('Пользователь не найден', 'Пользователь не найден или не указан. \
                          Использование команды: .бан {участник} {кол-во дней (цифрой)} <причина> \n\
                          Если в количестве дней указать "навсегда" - пользователя забанит навсегда...', message.member.user.avatarURL(), message)
            }
        }else{
            emb_error('Недостаточно прав', 'У вас недостаточно прав! \
                          Требуются права администратора, или же права на бан пользователя.', message.member.user.avatarURL(), message)
        }
    });
    }
    if(command == "мьют"){
        const {member, mentions} = message
        if (member.hasPermission('ADMINISTRATOR') || member.hasPermission('MANAGE_CHANNELS') || member.hasPermission('MANAGE_MESSAGES')){
            const memb = message.mentions.users.first()
            if(memb){
                db.run(`UPDATE gusers SET mute = ? WHERE id_u = ? AND id_g = ?`, [1, memb.id, message.guild.id])
                const muteemb = new Discord.MessageEmbed()
                .setTitle('Пользователь замьючен')
                .setColor(botColor)
                .setDescription('Пользователь замьючен. Его можно размьютить командой: размьют {пользователь}')
                .setFooter("{} - обяз. аргумент, <> - необяз.", client.user.avatarURL())
                message.delete();
                message.channel.send(muteemb).then(msg =>{
                    okey('✅', msg, userid)
                });
            }else{
                emb_error('Пользователь не найден', 'Пользователь не найден или не указан. \
                          Использование команды: .мьют {участник}', message.member.user.avatarURL(), message)
            }
        }else{
            emb_error('Недостаточно прав', 'У вас недостаточно прав! \
                          Требуются права администратора, или же права на управление каналом/сообщениями.', message.member.user.avatarURL(), message)
        }
    }
    if(command == "размьют"){
        const {member, mentions} = message
        if (member.hasPermission('ADMINISTRATOR') || member.hasPermission('MANAGE_CHANNELS') || member.hasPermission('MANAGE_MESSAGES')){
            const memb = message.mentions.users.first()
            if(memb){
                db.run(`UPDATE gusers SET mute = ? WHERE id_u = ? AND id_g = ?`, [0, memb.id, message.guild.id])
                const muteemb = new Discord.MessageEmbed()
                .setTitle('Пользователь размьючен')
                .setColor(botColor)
                message.delete();
                message.channel.send(muteemb).then(msg =>{
                    okey('✅', msg, userid)
                });
            }else{
                emb_error('Пользователь не найден', 'Пользователь не найден или не указан. \
                          Использование команды: .размьют {участник}', message.member.user.avatarURL(), message)
            }
        }else{
            emb_error('Недостаточно прав', 'У вас недостаточно прав! \
                          Требуются права администратора, или же права на управление каналом/сообщениями.', message.member.user.avatarURL(), message)
        }
    }
    if(command == "пинг"){
        message.delete();
        let ping_bot = Math.round(client.ws.ping);
        let color;
        if (ping_bot <= 600) color = 0x19BA19;
        if (ping_bot > 600 && ping_bot < 1000) color = 0xF1F438;
        if (ping_bot > 1000) color = 0xDA1010
        const ping = new Discord.MessageEmbed()
        .setTitle("Пинг бота:")
        .setDescription(`Мой пинг: ${ping_bot}ms.`)
        .setColor(color); message.channel.send(ping);
    }
    if(command == "с"){
        let argument = message.content.slice(".c".length).trim();
        const arrgs = message.content.slice(prefix.length += 2).trim().split(' ');
        message.delete();
        for (let i = 0; i <= arrgs.length; i+=1){
            const emojee = client.emojis.cache.get(emojiscds[arrgs[i]]); 
            if (emojee != undefined) argument = argument.replace(`${arrgs[i]}`, emojee);
        }
        message.channel.send(argument)
    }
    if (command == "эмодзи"){
        message.delete();
        const e1 = client.emojis.cache.get('798975013801689108'); 
        const e2 = client.emojis.cache.get('798975133993664522'); 
        const e3 = client.emojis.cache.get('798975169489797120'); 
        const e4 = client.emojis.cache.get('798933227867209808'); 
        const emojiesEmb = new Discord.MessageEmbed()
        .setColor(botColor)
        .setTitle('Эмодзи в боте:')
        .setDescription(`${e1} : ^rystal^\n\
                         ${e2} : ^book^\n\
                         ${e3} : ^purplecry^\n\
                         ${e4} : ^group^`)
        .setFooter('^emoji^ - использование')
        message.channel.send(emojiesEmb)
    }
    if(command == "пред"){
        message.delete();
        const {member, mentions} = message
        const memb = message.mentions.users.first()
        if(memb){
            const target = message.guild.members.cache.get(memb.id)
            let reason = message.content.slice(prefix.length + `пред <@${memb.id}>`.length + 1).trim()
            if (!reason || reason == " "){
                emb_error('Вы не указали причину!', 
                'Вы не указали причину! \n Пример использования команды: .пред {участник} {причина}', 
                message.author.avatarURL(), message);
                return;
            }
        let queryp;
        queryp = `SELECT * FROM preds WHERE id_u = ? AND id_g = ?`
        db.get(queryp, [memb.id, message.guild.id], (err, row) =>{
            let prds = [row.pred1, row.pred2, row.pred3, row.pred4, row.pred5]; 
            let prdsS = ['pred1', 'pred2', 'pred3', 'pred4', 'pred5'];
            let rsn = [row.pred1r, row.pred2r, row.pred3r, row.pred4r, row.pred5r]; let rsnS = ['pred1r', 'pred2r', 'pred3r', 'pred4r', 'pred5r'];
            for (let i = 0; i < prds.length; i++){
                if(prds[i] == 0){
                    db.run(`UPDATE preds SET ${prdsS[i]} = ?, ${rsnS[i]} = ? WHERE id_u = ? AND id_g = ?`, [1, reason, memb.id, message.guild.id])
                    message.channel.send(i)
                    let nump = i + 1;
                    message.channel.send(nump)
                    const emb_pr = new Discord.MessageEmbed()
                    .setTitle('Был выдан пред...')
                    .setColor(botColor)
                    .setDescription(`У этого участника уже ${nump} предов!`)
                    .addFields({name: 'Модератор:', value: message.author.username},
                                {name: 'Пострадавший:', value: memb.username},
                                {name: 'Причина:', value: reason})
                    message.channel.send(emb_pr).then(msg =>{
                        okey('✅', msg, userid);
                    })
                    break;
                }
        }
    }); 
    }else{
        emb_error('Вы не указали участника!', 
        'Вы не указали участника! \n Пример использования команды: .пред {участник} {причина}', 
        message.author.avatarURL(), message);
    }
    }
    if(command == "преды"){
        message.delete();
        const {member, mentions} = message;
        const memb = message.mentions.users.first();
        let mid, mname, aurl;
        if(!memb){
            mid = message.author.id; 
            mname = message.author.username;
            aurl = message.author.avatarURL()
        }else{
            mid = memb.id;
            mname = memb.username;
            aurl = memb.avatarURL()
        }
        let queryps = `SELECT * FROM preds WHERE id_u = ? AND id_g = ?`
        db.get(queryps, [mid, message.guild.id], (err, row) =>{
            let text = "";
            let prds = [row.pred1, row.pred2, row.pred3, row.pred4, row.pred5]; 
            let rsn = [row.pred1r, row.pred2r, row.pred3r, row.pred4r, row.pred5r];
            let prdsS = ['1.', '2.', '3.', '4.', '5.'];
            if (prds[0] == 0) text+="У участника нет ещё ни одного предупреждения!";
            for (let i = 0; i < prds.length; i++){
                if(prds[i] == 1){
                    text+=`${prdsS[i]} Причина: ${rsn[i]} \n`
                }
            }
            const embp = new Discord.MessageEmbed()
            .setTitle('Предупреждения:')
            .setColor(botColor)
            .setDescription(text)
            .setAuthor(mname, aurl)
            message.channel.send(embp);
        });
    }
    if(command == "разпред"){
        message.delete();
        const {member, mentions} = message
        const memb = message.mentions.users.first()
        if(memb){
            const target = message.guild.members.cache.get(memb.id)
            let number = message.content.slice(prefix.length + `разпред <@${memb.id}>`.length + 1).trim()
            if (!number){
                emb_error('Вы не указали номер предупреждения!', 
                'Вы не указали номер предупреждения! \n Пример использования команды: .разпред {участник} {номер преда}', 
                message.author.avatarURL(), message);
                return;
            }
        let queryp;
        queryp = `SELECT * FROM preds WHERE id_u = ? AND id_g = ?`
        db.get(queryp, [memb.id, message.guild.id], (err, row) =>{
            let prds = [row.pred1, row.pred2, row.pred3, row.pred4, row.pred5]; 
            let prdsS = ['pred1', 'pred2', 'pred3', 'pred4', 'pred5'];
            let rsn = [row.pred1r, row.pred2r, row.pred3r, row.pred4r, row.pred5r]; let rsnS = ['pred1r', 'pred2r', 'pred3r', 'pred4r', 'pred5r'];
            for (let i = 0; i < prds.length; i++){
                if (i == number){
                    db.run(`UPDATE preds SET ${prdsS[i-1]} = ? WHERE id_u = ? AND id_g = ?`, [0, memb.id, message.guild.id])
                    const emb_pr = new Discord.MessageEmbed()
                    .setTitle('Был выдан пред...')
                    .setColor(botColor)
                    .setDescription(`У этого участника сняли пред!`)
                    .addFields({name: 'Модератор:', value: message.author.username},
                                {name: 'Участник:', value: memb.username},
                                {name: 'Причина преда:', value: rsn[i-1]})
                    message.channel.send(emb_pr).then(msg =>{
                        okey('✅', msg, userid);
                    })
                    break;
                }
        }
    }); 
    }else{
        emb_error('Вы не указали участника!', 
        'Вы не указали участника! \n Пример использования команды: .пред {участник} {причина}', 
        message.author.avatarURL(), message);
    }
    }
    if(command == "сервер"){
        let voices = message.guild.channels.cache.filter(e => e.type == "voice").size;
        let texts = message.guild.channels.cache.filter(e => e.type == "text").size;
        let channels = voices+texts;
        let categorys = message.guild.channels.cache.size - channels;
        let afk = message.guild.afkChannel;
        if(!afk){
            afk = "Не установлен";
        }
        const membs = client.emojis.cache.get('798933227867209808');
        const serv = new Discord.MessageEmbed()
        .setTitle(message.guild.name)
        .setColor(botColor)
        .setThumbnail(message.guild.iconURL())
        .addField(`${membs}Участников:`, message.guild.memberCount)
        .addFields({name: 'ID Сервера:', value: message.guild.id, inline: true},
                    {name: 'ID Создателя:', value: message.guild.ownerID, inline: true},
                    {name: ':pushpin:Владелец:', value: message.guild.owner.user.username, inline: true},
                    {name: 'Каналов:', value: channels, inline: true},
                    {name: 'Категорий:', value: categorys, inline: true},
                    {name: 'AFK канал:', value: afk, inline: true},
                    {name: ':page_facing_up:Текстовые каналы:', value: texts, inline: true},
                    {name: ':microphone2:Голосовые каналы:', value: voices, inline: true})
        message.delete();
        message.channel.send(serv);
    }
    if(command == 'очистить'){
        message.delete();
        const {member, mentions} = message
        if (member.hasPermission('ADMINISTRATOR') || member.hasPermission('MANAGE_MESSAGES')){
        if(!args[0]){
            emb_error('Не указано количество!', "Не указано количество сообщений для удаления.\
            Использование команды: .очистить {кол-во сообщений}.", message.member.user.avatarURL(), message)
            return;
        }
        if (args[0] != Number){
            emb_error('Упссс..', 'Количество должно быть указано числом', message.member.user.avatarURL(), message) 
            return;
        }
        let numa = args[0]++;
        message.channel.bulkDelete(numa, true);
        const msg_del = new Discord.MessageEmbed()
        .setTitle('Очистка завершена!')
        .setColor(botColor)
        .setDescription(`Было удалено ${args[0]-1} сообщений!`)
        message.channel.send(msg_del).then(msg =>{
            okey('✅', msg, userid)
        })
        }else{
            emb_error('Недостаточно прав', 'У вас недостаточно прав!. \
            Требуются права администратора, или же права на управление сообщениями.', message.member.user.avatarURL(), message)
        }
    }
    if(command == "профиль"){
        message.delete();
        const {member, mentions} = message
        const memb = message.mentions.users.first()
        const rekon = client.emojis.cache.get('798975013801689108');
        const lvl = client.emojis.cache.get('798975133993664522');
        const exp = client.emojis.cache.get('798975169489797120');
        let query = `SELECT * FROM users WHERE id = ?`
        let memb_id, created, joined, name, avatar_url, last_message;
        if(memb){
            const memb_guild = message.guild.members.cache.get(memb.id)
            memb_id = memb.id;
            created = memb.createdAt;
            joined = memb_guild.joinedAt;
            name = memb.username;
            avatar_url = memb.avatarURL();
        }else{
            memb_id = userid;
            created = message.member.user.createdAt;
            joined = message.member.joinedAt;
            name = message.member.user.username;
            avatar_url = message.member.user.avatarURL();
        }
        db.get(query, [memb_id], (err, row) => {
            if (err){
                console.log(err);
                return;
        }
        if(!row){
            return message.channel.send('Пользователь не найден в базе данных. Это означает что он не написал ни одного сообщения при боте..').then(msg =>{
                okey('❌', msg, userid);
            })
        }
        let page = 1;
        const prof = new Discord.MessageEmbed()
        .setTitle(name)
        .setColor(botColor)
        .setThumbnail(avatar_url)
        .setDescription('Профиль')
        .addFields({name: `${rekon}Реконы:`, value: row.cash, inline: true},
                    {name: `${lvl}Уровень:`, value: row.lvl, inline: true},
                    {name: `${exp}Опыт:`, value: `${row.exp}/${200*row.lvl}`, inline: true})
        const inf = new Discord.MessageEmbed()
        .setTitle(name)
        .setColor(botColor)
        .setThumbnail(avatar_url)
        .setDescription('Информация')
        .addFields({name: 'Ваш ID', value: memb_id},
                    {name: 'Дата создания аккаунта:', value: created},
                    {name: 'Дата присоединение к серверу:', value: joined})
        message.channel.send(prof).then(msg => {
            msg.react('◀️').then(r =>{
                msg.react('▶️')
                const backfilt = (reaction, user) => reaction.emoji.name === '◀️' && user.id === userid;
                const forfilt = (reaction, user) => reaction.emoji.name === '▶️' && user.id === userid;

                const back = msg.createReactionCollector(backfilt, {time: 60000});
                const fors = msg.createReactionCollector(forfilt, {time: 60000});

                back.on('collect', r =>{
                    if (page == 1)   return;
                    msg.edit(prof); 
                    page--;
                    r.users.remove(userid);
                });
                fors.on('collect', r =>{
                    if (page == 2) return;
                    msg.edit(inf); 
                    page++;
                    r.users.remove(userid);
                })
            })
        })
    });
    }
    if (command == "идея"){
        const guildd = client.guilds.cache.get('806229798237372416')
        const channel = guildd.channels.cache.get('812987501953941524')
        message.delete()
        const argsi = message.content.slice(prefix.length + "идея".length)
        const ideae = new Discord.MessageEmbed()
        .setTitle('Отличная идея, правда? :bulb:')
        .setColor(botColor)
        .setDescription(argsi)
        .addField('Статус:', 'На рассмотрении')
        .setFooter(message.author.username, message.author.avatarURL())
        const ideaok = new Discord.MessageEmbed()
        .setTitle('Отличная идея, правда? :bulb:')
        .setColor(botColor)
        .setDescription(argsi)
        .addField('Статус:', 'Принято')
        .setFooter(message.author.username, message.author.avatarURL())
        const ideano = new Discord.MessageEmbed()
        .setTitle('Отличная идея, правда? :bulb:')
        .setColor(botColor)
        .setDescription(argsi)
        .addField('Статус:', 'Отклонено')
        .setFooter(message.author.username, message.author.avatarURL())
        let uses = 0; 
        channel.send(ideae).then(idea =>{
            idea.react('✅')
            idea.react('❌')

            const Fok = (reaction, user) => reaction.emoji.name === '✅' && user.id === ownerid; 
			const Fno = (reaction, user) => reaction.emoji.name === '❌' && user.id === ownerid;
				
			const ok = idea.createReactionCollector(Fok, {time: 1200000});
            const no = idea.createReactionCollector(Fno, {time: 1200000});

            ok.on('collect', r =>{
                if(uses == 1) return;
                idea.edit(ideaok);
                uses++;
            })
            no.on('collect', r =>{
                if(uses == 1) return;
                idea.edit(ideano);
                uses++;
            })
        })
    }
    if (command == "баг"){
        const guildd = client.guilds.cache.get('806229798237372416')
        const channel = guildd.channels.cache.get('812987438263435264')
        message.delete()
        const argsi = message.content.slice(prefix.length + "идея".length)
        const bage = new Discord.MessageEmbed()
        .setTitle('Упс... Замечен баг...')
        .setColor(botColor)
        .setDescription(argsi)
        .addField('Статус', 'Не тронут..')
        .setFooter(message.author.username, message.author.avatarURL())
        const bagok = new Discord.MessageEmbed()
        .setTitle('Упс... Замечен баг...')
        .setColor(botColor)
        .setDescription(argsi)
        .addField('Статус', 'Пофикшен')
        .setFooter(message.author.username, message.author.avatarURL())
        const bagno = new Discord.MessageEmbed()
        .setTitle('Упс... Замечен баг...')
        .setColor(botColor)
        .setDescription(argsi)
        .addField('Статус', 'Не найден')
        .setFooter(message.author.username, message.author.avatarURL())
        let uses = 0;
        channel.send(bage).then(bag =>{
            bag.react('✅')
            bag.react('❌')

            const Fok = (reaction, user) => reaction.emoji.name === '✅' && user.id === ownerid; 
            const Fno = (reaction, user) => reaction.emoji.name === '❌' && user.id === ownerid;
                
            const ok = bag.createReactionCollector(Fok, {time: 1200000});
            const no = bag.createReactionCollector(Fno, {time: 1200000});

            ok.on('collect', r =>{
                if(uses == 1) return;
                bag.edit(bagok);
                uses++;
            })
            no.on('collect', r =>{
                if(uses == 1) return;
                bag.edit(bagno);
                uses++;
            })
        })
    }
    if(command == "эмбед"){
        message.delete();
        const args_emb = message.content.slice(prefix.length).trim().split("'");
        let foot;
        if(!args_emb[5]){foot = 'Не указано'}else foot = args_emb[5]
        const emb = new Discord.MessageEmbed()
        .setTitle(args_emb[1])
        .setColor(botColor)
        .setDescription(args_emb[3])
        .setFooter(foot)
        message.channel.send(emb)
    }
    if(command == "модерация"){
        let querys = 'SELECT * FROM servers WHERE id = ?'
        db.get(querys, [message.guild.id], (err, row) =>{
            if(err){
                console.log(err);
                return;
            }
        message.delete();
        let filters, mess, ems;
        if(row.filtr === 'off'){
            filters = 'on'; mess = "включена"; ems = ':x:'
        }else filters = 'off'; mess = "выключена"; ems = ':white_check_mark:'
        let logg, ems_log;
        if(row.logs === 'off'){ 
            logg = 'on'; ems_log = ':x:'
        }else logg = 'off'; ems_log = ':white_check_mark:'
        let query = `SELECT * FROM servers WHERE id = ?`
        const moder = new Discord.MessageEmbed()
        .setTitle('Настройки')
        .setColor(botColor)
        .setDescription(`\
        :no_entry_sign: **Фильтрация чата:** ${row.filtr}\n\
        :incoming_envelope: **Логи:** ${row.logs}\
        `)
        
        message.channel.send(moder).then(msg => {
            msg.react('🚫').then(r =>{
                msg.react('📨')
                const filterfilt = (reaction, user) => reaction.emoji.name === '🚫' && user.id === userid;
                const logfilt = (reaction, user) => reaction.emoji.name == '📨' && user.id === userid;

                const log = msg.createReactionCollector(logfilt, {time: 60000});
                let log_use = 0;
                const filter = msg.createReactionCollector(filterfilt, {time: 60000});

                filter.on('collect', r =>{
                    db.run(`UPDATE servers SET filtr = ? WHERE id = ?`, [filters, message.guild.id]);
                    msg.delete();
                    if(row.filtr === 'off') message.channel.send(`Фильтрация чата успешно включена!`)
                    if(row.filtr === 'on') message.channel.send(`Фильтрация чата успешно выключена!`)
                    r.users.remove(userid);
                })
                log.on('collect', r =>{
                    if(row.logs == 'on'){
                        msg.delete()
                        db.run(`UPDATE servers SET logs = ?, log_channel = ? WHERE id = ?`, ['off', 'id', message.guild.id]);
                        message.channel.send('Логи успешно отключены')
                        r.users.remove(userid);
                    }else if (row.logs = 'off'){
                        const filter = m => m.author.id === message.author.id
                        const collector = message.channel.createMessageCollector(filter, { time: 60000 });

                        message.channel.send('Введите id канала в котором будут логи.').then(a => {
                        collector.on('collect', m => {
                            if(log_use == 0){
                            const chann = message.guild.channels.cache.get(m.content);
                            db.run(`UPDATE servers SET logs = ?, log_channel = ? WHERE id = ?`, ['on', m.content, message.guild.id]);
                            message.channel.send("Чат логов установлен").then(msgg => {
                                okey('✅', msgg, userid)
                                a.delete();
                            })
                            log_use++;
                            r.users.remove(userid);
                            }
                        })
                        });
                    }
                })
            })
        })
    });
    }
/*    if(command == "голосование"){
        const args_gol = message.content.slice(prefix.length + command.length).trim().split(",");
        message.channel.messages.fetch(args_gol[0]).then(msg => {
        for (let i = 1; i<args_gol.length; i++){
            emojis = args_gol[i].matchAll(/\<a?\:(?:.+?)\:(\d+?)\>/g)
            emojis = [...emojis].map(e => {
                reactis = guild.emojis.cache.get(e[0]);
                msg.react(reactis.id)
                
            });
        }
        message.channel.send(args_gol.length)
    })
    }*/
    if(command == "бот"){
        const bot = new Discord.MessageEmbed()
        .setTitle('О боте')
        .setColor(botColor)
        //.setDescription(news)
        .addField('Сервера:', client.guilds.cache.size)
        .addField('Людей:', client.users.cache.size)
        .addField("Ссылка", "[клик](https://discord.com/oauth2/authorize?client_id=798913035191713812&scope=bot&permissions=1032)")
        .addField('Версия', version)
        message.delete()
        message.channel.send(bot);
        if(args.join(' ') == "eval"){
            if(message.author.id != ownerid){
                message.channel.send('У вас недостаточно прав! Вам нужно быть модератором бота!');
                return;
            }
            message.channel.send(`${client.guilds.cache.array()}`)
        }
    }
    if(command == "eval"){
        let evaled;
    try {
      evaled = await eval(args.join(' '));
      message.channel.send(inspect(evaled));
      console.log(inspect(evaled));
    }
    catch (error) {
      console.error(error);
      message.reply('Ошибка');
    }
    }
});

client.login(token);
