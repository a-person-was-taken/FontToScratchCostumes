var font = {};
var fileName = "font.sprite3";
var fontSize = 16;

function md5(text) {
    return CryptoJS.MD5(text).toString();
}

function openFont(event) {
    var reader = new FileReader();
    reader.onload = function () {
        font = opentype.parse(reader.result);
        const bounds = font.getPath('H', 0, 0, 1).getBoundingBox();
        fontSize = 16 / (bounds.y2 - bounds.y1);

        var name = font.names.fullName.en;
        if (name !== void 0) {
            name = name.replace(" Regular", "").replace(" Normal", "").replace(" Book", "");
            name = name.replace(" regular", "").replace(" normal", "").replace(" book", "");
            document.getElementById("fontName").value = name;
        }

        document.getElementById('fontSelected').style.display = 'block';
    }

    reader.readAsArrayBuffer(event.target.files[0]);
}

function openSb3() {
    var reader = new FileReader();
    reader.onload = function () {
        JSZip.loadAsync(reader.result).then(inject);
    }

    const target = document.getElementById("sb3File");
    fileName = target.files[0].name;
    reader.readAsArrayBuffer(target.files[0]);
}

function submit() {
    const zip = new JSZip();
    inject(zip);
}

function inject(sb3) {

    function process(sprite) {

        fontName = document.getElementById("fontName").value;
        index = 0;

        var charset = document.getElementById("charset").value;
        if (charset.indexOf(" ") === -1) {
            charset = " " + charset;
        }

        var path;
        var svg;
        var md5Value;

        const box = font.getPath("o", 0, 0, fontSize).getBoundingBox();
        const centreY = (box.y2 - box.y1) / 2;

        //        sprite.costumes = sprite.costumes.filter(s => s.name.length === 1);   // Clear them all out!

        for (let i = 0; i < sprite.costumes.length; i++) {
            const costume = sprite.costumes[i];
            if (costume.name.length === 1) {
                let assetFile = costume.md5ext;
                sb3.remove(assetFile);
                sprite.costumes.splice(i--, 1);
            }
        }

        let costumeIndex = 0;
        for (let i = 0; i < charset.length; i++) {

            const char = charset.charAt(i);
            const charDisp = char === ' ' ? 'o' : char;
            let advance = font.getAdvanceWidth(charDisp, fontSize);
            // if (!advance) {  // we need to use bounding box...
            const box = font.getPath(charDisp, 0, 0, fontSize).getBoundingBox();
            advance = (box.x2 + box.x1);
            // }

            path = font.getPath(charDisp, 24 - advance / 2, 24 + centreY, fontSize).toPathData(3);
            svg = `<svg width="48px" height="48px" xmlns="http://www.w3.org/2000/svg"><path fill="${char === ' ' ? '#00f' : '#F00'}" d="${path}"/></svg>`;
            md5Value = md5(svg);

            sprite.costumes.splice(costumeIndex, 0, {
                assetId: md5Value,
                name: char,
                md5ext: md5Value + ".svg",
                dataFormat: "svg",
                bitmapResolution: 1,
                rotationCenterX: 24,
                rotationCenterY: 24
            });
            // charWidths.push(Math.round(1000 * font.getAdvanceWidth(charset.charAt(i), fontSize)) / 16000);

            sb3.file(md5Value + ".svg", svg);

            costumeIndex++;
        }

        sb3.file("sprite.json", JSON.stringify(sprite));
        sb3.generateAsync({ type: "base64" }).then(download);


        function getSprite(data, spriteName) {
            data = data.targets;
            for (let i = 0; i < data.length; i++) {
                if (data[i].name === spriteName) return data[i];
            }
            return "Error";
        }

        function getList(sprite, listName) {
            const lists = Object.values(sprite.lists);
            for (let i = 0; i < lists.length; i++) {
                if (lists[i][0] === listName) return lists[i][1];
            }
            return "Error";
        }
    }

    let sprite = sb3.file("sprite.json");
    if (sprite === null) {

        sprite = {
            "name": "Font",
            "isStage": false, "variables": {}, "lists": {}, "broadcasts": {}, "blocks": {}, "comments": {}, "currentCostume": 1,
            "costumes": [],
            "sounds": [], "volume": 100, "visible": true, "x": 0, "y": 0, "size": 100, "direction": 90, "draggable": false, "rotationStyle": "all around"
        };

        process(sprite);

    } else {

        sprite.async("string").then(function (t) { process(JSON.parse(t)) });
    }

}

function download(data) {
    var link = document.createElement("a");
    link.style.display = "none";
    link.download = fileName;
    link.href = "data:application/zip;base64," + data;
    document.body.appendChild(link);
    link.click();
    // alert("The project has been downloaded");
}