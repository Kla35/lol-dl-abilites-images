const fs = require('fs');
const fetch = require('node-fetch');
const cliProgress = require('cli-progress');
const bar1 = new cliProgress.SingleBar({stopOnComplete: true}, cliProgress.Presets.shades_classic);

(async () => {
    fs.mkdirSync('./image', { recursive: true })
    versionCDN = await getActualVersion();
    const champions = await championsData();
    bar1.start(Object.keys(champions).length*5, 0);
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

    // setInterval() check every second if everything is finish
})();

function defineSpellKey(str){
    switch(str){
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
    
    fetch(imageURL)
    .then(async res => {
        res.body.pipe(fs.createWriteStream('./image/'+newName));
        await bar1.increment();
    })
    
}

async function getChampionDataById(id){
    const response = await fetch('https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champions/'+id+'.json');
    const jsonChampion = await response.json();
    return jsonChampion;
}

async function championsData(){
    const response = await fetch('https://ddragon.leagueoflegends.com/cdn/'+versionCDN+'/data/en_US/champion.json');
    const jsonChampion = await response.json();
    var data = jsonChampion.data;
    return data;
}

async function getActualVersion(){
    const response = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
    const jsonVersion = await response.json();
    return jsonVersion[0];
}