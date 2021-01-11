const Discord = require('discord.js');
const { inspect } = require('util');
const fs = require('fs')
const client = new Discord.Client();
const sqlite3 = require('sqlite3').verbose();
//+++
let config = require('./settings.json');
const { on } = require('process');
let token = config.token;
let prefix = config.prefix;
let version = config.vesion;
let ownerid = '535402224373989396';

//Conn db, bot
let db = new sqlite3.Database('./users.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to database!')
    });

client.on('ready', () => {
    console.log("Bot actived");
})

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1) ) + min;
}

//Mess
client.on('message', async message => {
    let userid = message.author.id;
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;
    const commandBody = message.content.slice(prefix.length);
    //const args = commandBody.split(' ');
    const args = message.content.slice(prefix.length).trim().split(' ');
    let command = args.shift().toLowerCase();
    let query = `SELECT * FROM users WHERE id = ?`;
    db.get(query, [userid], (err, row) => {
        if (err){
            console.log(err);
            return;
        };
        if (row == undefined){
            let insert = db.prepare(`INSERT INTO users VALUES(?, ?, ?, ?, ?, ?, ?, ?)`);
            let cash = 100; let lvl = 1; let exp = 0; let stone = 0; let iron = 0; let ruda_iron = 0; let coal = 0;
            insert.run(userid, cash, lvl, exp, stone, coal, ruda_iron, iron, err => {
                if (err){
                    console.log(err);
                    return;
                };
            });
            insert.finalize();
        };
    });
    if(command=="профиль"){
        let query = `SELECT * FROM users WHERE id = ?`;
        db.get(query, [userid], (err, row) => {
        if (err){
            console.log(err);
            return;
        };
        let page = 1;
        const profile = new Discord.MessageEmbed()
        .setTitle("Профиль")
        .addFields({name: "Деньги:", value: `${row.cash}`},
                   {name: "Уровень:", value: row.lvl})
        message.channel.send(profile).then(msg => {
            msg.react('◀️').then(r =>{
                msg.react('▶️')
                const forfilt = (reaction, user) => reaction.emoji.name === '▶️' && user.id === userid;
                const backfilt = (reaction, user) => reaction.emoji.name === '◀️' && user.id === userid;
                const forc = msg.createReactionCollector(forfilt, {time: 60000});
                const back = msg.createReactionCollector(backfilt, {time: 60000});
            forc.on('collect', r =>{
                if(page == 2) return;
                page+=1;
                const inv = new Discord.MessageEmbed()
                .setTitle('Инвентарь')
                .addFields({name: "камень", value: row.stone, inline: true},
                            {name: "уголь", value: row.coal, inline: true})
                msg.edit(inv);
            });
            back.on('collect', r =>{
                if(page == 1) return;
                page-=1;
                msg.edit(profile);
            });
            });
        })
    });
    };
    if(command=="шахта"){
        let query = `SELECT * FROM users WHERE id = ?`;
        db.get(query, [userid], (err, row) => {
        if (err){
            console.log(err);
            return;
        };
        let yes = 0;
        const mine = new Discord.MessageEmbed()
        .setTitle("Шахта")
        .setDescription(":brown_square: :brown_square: :brown_square:")
        message.channel.send(mine).then(msg => {
            msg.react('1️⃣').then(r => {
                msg.react('2️⃣');
                msg.react('3️⃣');
                const onefilt = (reaction, user) => reaction.emoji.name === '1️⃣' && user.id === userid;
                const twofilt = (reaction, user) => reaction.emoji.name === '2️⃣' && user.id === userid;
                const threefilt = (reaction, user) => reaction.emoji.name === '3️⃣' && user.id === userid;

                const one = msg.createReactionCollector(onefilt, {time: 60000});
                const two = msg.createReactionCollector(twofilt, {time: 60000});
                const three = msg.createReactionCollector(threefilt, {time: 60000});

                function giv_emb(give, give_int){
                    const giv = new Discord.MessageEmbed()
                    .setTitle('Шахта')
                    .setDescription('Вы получили...')
                    .addField(give, give_int)
                    msg.edit(giv);
                }

                one.on('collect', r =>{
                    if (yes == 1) return;
                    rand = random(0, 100);let give = "";let give_int = 0;
                    if (rand >= 40){
                        give = "Камень";
                        give_int = random(2, 10);
                        give_add = row.stone + give_int;
                        db.run('UPDATE users SET stone = ? WHERE id = ?', [give_add, userid]);
                    }else{
                        give = "Уголь";
                        give_int = random(1, 6) 
                        give_add = row.coal + give_int;
                        db.run('UPDATE users SET coal = ? WHERE id = ?', [give_add, userid]);
                    }
                    yes+=1;
                    giv_emb(give, give_int);
                });
                two.on('collect', r =>{
                    if (yes == 1) return;
                    rand = random(0, 100);let give = "";let give_int = 0;
                    if (rand >= 40){
                        give = "Камень";
                        give_int = random(2, 10);
                        give_add = row.stone + give_int;
                        db.run('UPDATE users SET stone = ? WHERE id = ?', [give_add, userid]);
                    }else{
                        give = "Уголь";
                        give_int = random(1, 6) ;
                        give_add = row.coal + give_int;
                        db.run('UPDATE users SET coal = ? WHERE id = ?', [give_add, userid]);
                    }
                    yes+=1;
                    giv_emb(give, give_int);
                });
                three.on('collect', r =>{
                    if (yes == 1) return;
                    rand = random(0, 100);let give = "";let give_int = 0;
                    if (rand >= 40){
                        give = "Камень";
                        give_int = random(2, 10);
                        give_add = row.stone + give_int;
                        db.run('UPDATE users SET stone = ? WHERE id = ?', [give_add, userid]);
                    }else{
                        give = "Уголь";
                        give_int = random(1, 6);
                        give_add = row.coal + give_int;
                        db.run('UPDATE users SET coal = ? WHERE id = ?', [give_add, userid]);
                    }
                    yes+=1;
                    giv_emb(give, give_int);
                });
        });
        });
    });
    }
    if(command == "eval"){
        
        if (message.author.id !== ownerid) return;
        let evals;
        try {
            evals = await eval(args.join(' '));
            message.channel.send(inspect(evaled));
            console.log(inspect(evaled));
        }
        catch (error) {
            console.error(error);
            message.reply('Error');
        }
    }
    if(command == "продать"){
        db.get(query, [userid], (err, row) => {
            if (err){
                console.log(err);
                return;
            };
        let type = args[0].toLowerCase();
        let colv = args[1].toLowerCase();
        let prices = {
            "камень" : 2,
            "уголь" : 3
        };
        let sql = {
            "камень" : "stone",
            "уголь" : "coal"
        };
        let ruds = {
            "камень" : row.stone,
            "уголь" : row.coal
        };
        if(ruds[type] >= colv){
        let money = row.cash+(colv*prices[type]);
        let rudes = ruds[type]-colv;
        db.run(`UPDATE users SET cash = ?, ${sql[type]} = ? WHERE id = ?`, [money, rudes, userid])
        const magaz = new Discord.MessageEmbed()
        .setTitle("Успешная продажа..")
        .addFields({name: "Получено денег:", value: colv*prices[type]},
                    {name: "Ваши стредства:", value: money})
        .setFooter("Продажа", message.author.avatarURL())
        .setColor(0xB8860B)
        message.channel.send(magaz);
        }else{
            const not = new Discord.MessageEmbed()
            .setTitle("У вас недостаточно ресурсов!")
            .addFields({name: "Недостаточно ресурсов:", value: colv-ruds[type]})
            .setFooter("Продажа", message.author.avatarURL())
            .setColor(0xB8860B)
            message.channel.send(not);
        }
        });
    }
});

client.login(token);
