const fs = require('fs');
const fetch = require('node-fetch-retry');
const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({stopOnComplete: true}, cliProgress.Presets.shades_classic);
const championPerso = require('./othersabilities.json');

(async () => {
    fs.mkdirSync('./image', { recursive: true })
    versionCDN = await getActualVersion();
    const champions = await championsData();
    let countOthersAbilities = 0;
    championPerso.forEach(champion => {
        countOthersAbilities += champion.spells.length;
    })
    bar1.start((Object.keys(champions).length*5+countOthersAbilities), 0);
    Object.keys(champions).forEach(async function(k){
        let actualChampion = champions[k];
        let championName = actualChampion.name;
        let championData = await getChampionDataById(actualChampion["key"]);
        
        championData.spells.forEach(spell => {
            let spellKey = defineSpellKey(spell["spellKey"].toUpperCase());
            let newName = championName+'_'+spellKey+".png";
            downloadImage(spell.abilityIconPath,newName);
        });

        let newName = championName+"_Passif.png";
        downloadImage(championData.passive.abilityIconPath,newName);
    });

    championPerso.forEach(champion => {
        let championName = champion.name;
        champion.spells.forEach(spell => {
            let spellKey = defineSpellKey(spell["spellKey"].toUpperCase());
            let newName = championName+'_'+spellKey+".png";
            downloadImage(spell.abilityIconPath,newName);
        })
    })

    // setInterval() check every second if everything is finish
})();

function defineSpellKey(str){
    //Attention, dans le cas du JSON person, la passive doit être prise en compte
    switch(str){
        case "P2":
            return "Passif_2";
        case "P3":
            return "Passif_3";
        case "Q2":
            return "A_2";
        case "Q3":
            return "A_3";
        case "W2":
            return "W_2";
        case "W3":
            return "W_3";
        case "E2":
            return "E_2";
        case "E3":
            return "E_3";
        case "R2":
            return "R_2";
        case "R3":
            return "R_3";
        case "Q":
            return "A";
        case "W":
            return "Z";
        default:
            return str;
}

}

function downloadImage(download, newName){
    var imageURL = "";
    if(download.startsWith('/lol-game-data/assets/ASSETS/')){
        var trim = download.split('/lol-game-data/assets/ASSETS/');
        imageURL = 'https://raw.communitydragon.org/latest/game/assets/'+trim[1].toLowerCase();
    } else {
        var trim = download.split('/lol-game-data/assets/v1/champion-ability-icons/');
        imageURL = 'https://raw.communitydragon.org/latest/game/data/characters/qiyana/hud/icons2d/'+trim[1].toLowerCase();
    }
    
    fetch(imageURL,{retry:3})
    .then(async res => {
        res.body.pipe(fs.createWriteStream('./image/'+newName));
        await bar1.increment();
    })
    
}

async function getChampionDataById(id){
    const response = await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/'+id+'.json',{retry:3});
    const jsonChampion = await response.json();
    return jsonChampion;
}

async function championsData(){
    const response = await fetch('https://ddragon.leagueoflegends.com/cdn/'+versionCDN+'/data/en_US/champion.json',{retry:3});
    const jsonChampion = await response.json();
    var data = jsonChampion.data;
    return data;
}

async function getActualVersion(){
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json',{retry:3});
    const jsonVersion = await response.json();
    return jsonVersion[0];
}