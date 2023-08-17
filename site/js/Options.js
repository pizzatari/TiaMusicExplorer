export class Options { #fields = {};

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
        this.#fields.ShrinkPiano = false;
        this.#fields.ExpandPiano = false;
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

    // special form values
    get AtariTones() { return [...this.#fields.AtariTones] }
    set AtariTones(ary) { this.#fields.AtariTones = (Array.isArray(ary) ? ary : this.#fields.AtariTones) } 

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
    get ShrinkPiano() { return this.#fields.ShrinkPiano }
    set ShrinkPiano(val) { this.#fields.ShrinkPiano = val }
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

    readFromForm() {
        this.#fields.AtariTones.length = 0;
        this.#fields.AtariTones.push(parseInt(document.querySelector('#AtariTone0Id').value));

        let e = document.querySelector('#AtariTone1Id').value;
        if (e != null)
            this.#fields.AtariTones.push(parseInt(e));

        e = document.querySelector('#AtariTone2Id').value;
        if (e != null)
            this.#fields.AtariTones.push(parseInt(e));

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
        this.#fields.ShrinkPiano = document.querySelector('#ShrinkPianoId').checked;
        //this.#fields.ExpandPiano = document.querySelector('#ExpandPianoId').checked;
        this.#fields.JumpToFirst = document.querySelector('#JumpToFirstId').checked;
        //this.#fields.InnerJoin = document.querySelector('#InnerJoinId').checked;

        this.#fields.Instrument = document.querySelector('#InstrumentId').value;
        this.#fields.Scale = document.querySelector('#ScaleId').value;
        this.#fields.Volume = parseInt(document.querySelector('#VolumeId').value);
        this.#fields.Polyphony = parseInt(document.querySelector('#PolyphonyId').value);
        this.#fields.Velocity = document.querySelector('#VelocityId').checked;
    }

    writeToForm() {
        document.querySelector('#VideoFormatId').value = this.#fields.VideoFormat;
        document.querySelector('#AtariTone0Id').value = this.#fields.AtariTones[0];
        document.querySelector('#AtariTone1Id').value = this.#fields.AtariTones[1];
        document.querySelector('#AtariTone2Id').value = this.#fields.AtariTones[2];
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
        document.querySelector('#ShrinkPianoId').checked = this.#fields.ShrinkPiano;
        document.querySelector('#JumpToFirstId').checked = this.#fields.JumpToFirst;
        //document.querySelector('#InnerJoinId').checked = this.#fields.InnerJoin;

        document.querySelector('#InstrumentId').value = this.#fields.Instrument;
        document.querySelector('#ScaleId').value = this.#fields.Scale;
        document.querySelector('#VolumeId').value = this.#fields.Volume;
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
