console.enableNotice = true;
console.stream = {
    jt: { name: "Javatari", enabled: false },
    options: { name: "Options", enabled: true },
    index: { name: "Index Page", enabled: true },
    synth: { name: "Synth", enabled: true },
    instrument: { name: "Instrument", enabled: true },
    controller: { name: "Controller", enabled: true },
    audio: { name: "Web Audio", enabled: true },
    midi: { name: "Web MIDI", enabled: true},
    tia: { name: "TIA", enabled: true },
    ui: { name: "UI", enabled: true },
};
console.notice = function(prefix, msg) {
    if (console.enableNotice) {
        for (let i=1; i < arguments.length; i++) {
            if (typeof prefix != 'undefined') {
                if (prefix.enabled)
                    console.log(": " + prefix.name + ": " + arguments[i]);
            } else {
                console.log(": " + prefix + ": " + arguments[i]);
            }
        }
    }
};
