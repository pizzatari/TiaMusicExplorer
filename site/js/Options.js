const CART_URLS = {
    ntsc: './atari2600/NTSC.bin',
    pal: './atari2600/PAL.bin',
};

const MAX_ATARI_TONES = 3;

export class Options {
    #fields = {};

    constructor() {
        this.loadDefaults();
    }

    loadDefaults() {
        this.#fields.VideoFormat = 'ntsc';
        this.#fields.TuningMethod = '12-tet';
        this.#fields.A4Frequency = 440.0
        this.#fields.TuningSensitivity = 50;
        this.#fields.TuningGradient = true;
        this.#fields.CentTranspose = 0;
        this.#fields.NumMicroTones = 1;
        this.#fields.AtariTones = [ 1 ];

        this.#fields.PrintBlackKeys = false;
        this.#fields.PrintGeometry = true;
        this.#fields.PrintFrequency = true;
        this.#fields.Fixed88Keys = true;
        this.#fields.StretchFit = false;
        this.#fields.JumpToFirst = false;
        this.#fields.InnerJoin = false;

        this.#fields.Instrument = "Piano";
        this.#fields.Scale = "Piano";
        this.#fields.Volume = 64;
        this.#fields.Polyphony = 2;
        this.#fields.Velocity = true;

        this.#fields.FrequencyPrecision = 1;
        this.#fields.CentPrecision = 1;
        this.#fields.FirstPianoKey = 1;
        this.#fields.LastPianoKey = 88;
        this.#fields.FirstPianoOctave = 0;
    }

    get AtariTones() { return this.#fields.AtariTones }
    set AtariTones(ary) { this.#fields.AtariTones = ary } 

    getAtariTone(idx) { return this.#fields.AtariTones[idx] }
    setAtariTone(idx, val) { this.#fields.AtariTones[idx] = parseInt(val) }

    // form values
    get VideoFormat() { return this.#fields.VideoFormat }
    set VideoFormat(val) { this.#fields.VideoFormat = val }
    get TuningMethod() { return this.#fields.TuningMethod }
    set TuningMethod(val) { this.#fields.TuningMethod = val }
    get A4Frequency() { return this.#fields.A4Frequency }
    set A4Frequency(val) { this.#fields.A4Frequency = val }
    get CentTranspose() { return this.#fields.CentTranspose }
    set CentTranspose(val) { this.#fields.CentTranspose = val }
    get NumMicroTones() { return this.#fields.NumMicroTones }
    set NumMicroTones(val) { this.#fields.NumMicroTones = val }
    get TuningSensitivity() { return this.#fields.TuningSensitivity }
    set TuningSensitivity(val) { this.#fields.TuningSensitivity = val }

    get TuningGradient() { return this.#fields.TuningGradient }
    set TuningGradient(val) { this.#fields.TuningGradient = val }
    get PrintBlackKeys() { return this.#fields.PrintBlackKeys }
    set PrintBlackKeys(val) { this.#fields.PrintBlackKeys = val }
    get PrintGeometry() { return this.#fields.PrintGeometry }
    set PrintGeometry(val) { this.#fields.PrintGeometry = val }
    get PrintFrequency() { return this.#fields.PrintFrequency }
    set PrintFrequency(val) { this.#fields.PrintFrequency = val }
    get Fixed88Keys() { return this.#fields.Fixed88Keys }
    set Fixed88Keys(val) { this.#fields.Fixed88Keys = val }
    get StretchFit() { return this.#fields.StretchFit }
    set StretchFit(val) { this.#fields.StretchFit = val }
    get JumpToFirst() { return this.#fields.JumpToFirst }
    set JumpToFirst(val) { this.#fields.JumpToFirst = val }

    get Instrument() { return this.#fields.Instrument }
    set Instrument(val) { this.#fields.Instrument = val }
    get Scale() { return this.#fields.Scale }
    set Scale(val) { this.#fields.Scale = val }
    get Volume() { return this.#fields.Volume }
    set Volume(val) { this.#fields.Volume = val }
    get Polyphony() { return this.#fields.Polyphony }
    set Polyphony(val) { this.#fields.Polyphony = val }
    get Velocity() { return this.#fields.Volume }
    set Velocity(val) { this.#fields.Volume = val }

    // non form values
    get CartridgeURL() { return CART_URLS[this.#fields.VideoFormat] }
    get FrequencyPrecision() { return this.#fields.FrequencyPrecision }
    get CentPrecision() { return this.#fields.CentPrecision }
    get FirstPianoKey() { return this.#fields.FirstPianoKey }
    get LastPianoKey() { return this.#fields.LastPianoKey }
    get FirstPianoOctave() { return this.#fields.FirstPianoOctave }
    set FrequencyPrecision(val) { this.#fields.FrequencyPrecision = val }
    set CentPrecision(val) { this.#fields.CentPrecision = val }
    set FirstPianoKey(val) { this.#fields.FirstPianoKey = val }
    set LastPianoKey(val) { this.#fields.LastPianoKey = val }
    set FirstPianoOctave(val) { this.#fields.FirstPianoOctave = val }

    readFromForm(formElem) {
        this.#fields.AtariTones = [];

        for (let i=0; i < MAX_ATARI_TONES; i++) {
            let name = 'AtariTone' + i;
            let tone = formElem.elements[name].value;
            if (tone !== '' && tone !== null)
                this.#fields.AtariTones.push(parseInt(tone));
        }

        this.#fields.VideoFormat = document.querySelector('#VideoFormatId').value;
        this.#fields.TuningMethod = document.querySelector('#TuningMethodId').value;
        this.#fields.A4Frequency = parseFloat(document.querySelector('#A4FrequencyId').value);
        this.#fields.TuningSensitivity = parseInt(document.querySelector('#TuningSensitivityId').value);
        this.#fields.TuningGradient = document.querySelector('#TuningGradientId').checked;
        this.#fields.CentTranspose = parseInt(document.querySelector('#CentTransposeId').value);
        this.#fields.NumMicroTones = parseInt(document.querySelector('#NumMicroTonesId').value);

        this.#fields.PrintBlackKeys = document.querySelector('#PrintBlackKeysId').checked;
        //this.#fields.PrintGeometry = document.querySelector('#PrintGeometryId').checked;
        //this.#fields.PrintFrequency = document.querySelector('#PrintFrequencyId').checked;
        this.#fields.Fixed88Keys = document.querySelector('#Fixed88KeysId').checked;
        this.#fields.StretchFit = document.querySelector('#StretchFitId').checked;
        this.#fields.JumpToFirst = document.querySelector('#JumpToFirstId').checked;
        //this.#fields.InnerJoin = document.querySelector('#InnerJoinId').checked;

        this.#fields.Instrument = document.querySelector('#InstrumentId').value;
        this.#fields.Scale = document.querySelector('#ScaleId').value;
        this.#fields.Volume = parseInt(document.querySelector('#VolumeId').value);
        this.#fields.Polyphony = parseInt(document.querySelector('#PolyphonyId').value);
        this.#fields.Velocity = document.querySelector('#VelocityId').checked;
    }

    writeToForm(formElem) {
        document.querySelector('#VideoFormatId').value = this.#fields.VideoFormat;

        for (let i=0; i < MAX_ATARI_TONES; i++) {
            let name = 'AtariTone' + i;
            if (typeof this.#fields.AtariTones[i] != 'undefined')
                formElem.elements[name].value = this.#fields.AtariTones[i];
        }

        /*
        document.querySelector('#AtariTone0Id').value = typeof this.#fields.AtariTones[0] != 'undefined' ? this.#fields.AtariTones[0] : '';
        document.querySelector('#AtariTone1Id').value = typeof this.#fields.AtariTones[1] != 'undefined' ? this.#fields.AtariTones[1] : '';
        document.querySelector('#AtariTone2Id').value = typeof this.#fields.AtariTones[2] != 'undefined' ? this.#fields.AtariTones[2] : '';
        */

        document.querySelector('#TuningMethodId').value = this.#fields.TuningMethod;
        document.querySelector('#A4FrequencyId').value = this.#fields.A4Frequency;
        document.querySelector('#A4FrequencyRangeId').value = parseInt(this.#fields.A4Frequency);
        document.querySelector('#TuningSensitivityId').value = this.#fields.TuningSensitivity;
        document.querySelector('#TuningSensitivityRangeId').value = this.#fields.TuningSensitivity;
        document.querySelector('#TuningGradientId').checked = this.#fields.TuningGradient;
        document.querySelector('#CentTransposeId').value = this.#fields.CentTranspose;
        document.querySelector('#CentTransposeRangeId').value = this.#fields.CentTranspose;
        document.querySelector('#NumMicroTonesId').value = this.#fields.NumMicroTones;
        document.querySelector('#NumMicroTonesRangeId').value = this.#fields.NumMicroTones;

        document.querySelector('#PrintBlackKeysId').checked = this.#fields.PrintBlackKeys;
        //document.querySelector('#PrintGeometryId').checked = this.#fields.PrintGeometry;
        //document.querySelector('#PrintFrequencyId').checked = this.#fields.PrintFrequency;
        document.querySelector('#Fixed88KeysId').checked = this.#fields.Fixed88Keys;
        document.querySelector('#StretchFitId').checked = this.#fields.StretchFit;
        document.querySelector('#JumpToFirstId').checked = this.#fields.JumpToFirst;
        //document.querySelector('#InnerJoinId').checked = this.#fields.InnerJoin;

        document.querySelector('#InstrumentId').value = this.#fields.Instrument;
        document.querySelector('#ScaleId').value = this.#fields.Scale;
        document.querySelector('#VolumeId').value = this.#fields.Volume;
        document.querySelector('#VolumeRangeId').value = this.#fields.Volume;
        document.querySelector('#PolyphonyId').value = this.#fields.Polyphony;
        document.querySelector('#VelocityId').checked = this.#fields.Velocity;
    }

    saveToStorage() {
        let opts = {};
        for (let n in this.#fields) {
            opts[n] = this.#fields[n];
        }

        window.localStorage.setItem("Options", JSON.stringify(opts));
    }

    loadFromStorage() {
        let str = window.localStorage.getItem("Options");
        if (str == null) return;

        let opts = JSON.parse(str);
        if (opts == null) return;

        for (let n in opts) {
            if (opts[n] !== null)
                this.#fields[n] = opts[n];
        }
    }

    clearStorage() {
        window.localStorage.removeItem("Options");
    }

    getStorage() {
        return window.localStorage.getItem("Options");
    }

    toString() {
        let str = '';
        for (let n in this.#fields)
            str += n + '=' + this.#fields[n] + "\n";
        return str;
    }
}
