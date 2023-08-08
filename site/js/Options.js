export class Options {
	constructor() {
		this.loadDefaults();
	}

    #fields = {
        TuningMethod:null,
        A4Frequency:null,
        TuningSensitivity:null,
        TuningGradient:null,
        CentTranspose:null,
        NumMicroTones:null,
        AtariTones:new Array(),
        VideoFormat:null,
        PrintBlackKeys:null,
        PrintGeometry:null,
        PrintFrequency:null,
        ExpandPiano:null,
        ShrinkPiano:null,
        JumpToFirst:null,
        InnerJoin:null,
        EnableSound:null,
        Volume:null,
        Polyphony:null,
        FrequencyPrecision:null,
        CentPrecision:null,
        FirstPianoKey:null,
        LastPianoKey:null,
        FirstPianoOctave:null
    };

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
        this.#fields.EnableSound = false;
        this.#fields.Volume = 64;
        this.#fields.Polyphony = 2;
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
    get TuningMethod() { return this.#fields.TuningMethod }
    get A4Frequency() { return this.#fields.A4Frequency }
    get CentTranspose() { return this.#fields.CentTranspose }
    get NumMicroTones() { return this.#fields.NumMicroTones }
    get TuningSensitivity() { return this.#fields.TuningSensitivity }
    get TuningGradient() { return this.#fields.TuningGradient }
    get PrintBlackKeys() { return this.#fields.PrintBlackKeys }
    get PrintGeometry() { return this.#fields.PrintGeometry }
    get PrintFrequency() { return this.#fields.PrintFrequency }
    get ShrinkPiano() { return this.#fields.ShrinkPiano }
    get JumpToFirst() { return this.#fields.JumpToFirst }
    get EnableSound() { return this.#fields.EnableSound }
    get Volume() { return this.#fields.Volume }
    get Polyphony() { return this.#fields.Polyphony }
    set VideoFormat(val) { this.#fields.VideoFormat = val }
    set A4Frequency(val) { this.#fields.A4Frequency = val }
    set TuningMethod(val) { this.#fields.TuningMethod = val }
    set CentTranspose(val) { this.#fields.CentTranspose = val }
    set NumMicroTones(val) { this.#fields.NumMicroTones = val }
    set TuningSensitivity(val) { this.#fields.TuningSensitivity = val }
    set TuningGradient(val) { this.#fields.TuningGradient = val }
    set PrintBlackKeys(val) { this.#fields.PrintBlackKeys = val }
    set PrintGeometry(val) { this.#fields.PrintGeometry = val }
    set PrintFrequency(val) { this.#fields.PrintFrequency = val }
    set ShrinkPiano(val) { this.#fields.ShrinkPiano = val }
    set JumpToFirst(val) { this.#fields.JumpToFirst = val }
    set EnableSound(val) { this.#fields.EnableSound = val }
    set Volume(val) { this.#fields.Volume = val }
    set Polyphony(val) { this.#fields.Polyphony = val }

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
        this.#fields.AtariTones.push(parseInt(document.getElementById('AtariTone0Id').value));

        let e = document.getElementById('AtariTone1Id').value;
        if (e != '')
            this.#fields.AtariTones.push(parseInt(e));

        e = document.getElementById('AtariTone2Id').value;
        if (e != '')
            this.#fields.AtariTones.push(parseInt(e));

        this.#fields.VideoFormat = document.getElementById('VideoFormatId').value;
        this.#fields.TuningMethod = document.getElementById('TuningMethodId').value;
        this.#fields.A4Frequency = parseFloat(document.getElementById('A4FrequencyId').value);
        this.#fields.TuningSensitivity = parseInt(document.getElementById('TuningSensitivityId').value);
        this.#fields.TuningGradient = document.getElementById('TuningGradientId').checked ? true : false;
        this.#fields.CentTranspose = parseInt(document.getElementById('CentTransposeId').value);
        this.#fields.NumMicroTones = parseInt(document.getElementById('NumMicroTonesId').value);
        this.#fields.PrintBlackKeys = document.getElementById('PrintBlackKeysId').checked ? true : false;
        this.#fields.PrintGeometry = document.getElementById('PrintGeometryId').checked ? true : false;
        this.#fields.PrintFrequency = document.getElementById('PrintFrequencyId').checked ? true : false;
        this.#fields.ShrinkPiano = document.getElementById('ShrinkPianoId').checked ? true : false;
        this.#fields.JumpToFirst = document.getElementById('JumpToFirstId').checked ? true : false;
	    this.#fields.Volume = parseInt(document.getElementById('VolumeId').value);
        this.#fields.Polyphony = parseInt(document.getElementById('PolyphonyId').value);
    }

    writeToForm() {
        document.getElementById('AtariTone0Id').value = this.#fields.AtariTones[0];
        document.getElementById('AtariTone1Id').value = this.#fields.AtariTones[1];
        document.getElementById('AtariTone2Id').value = this.#fields.AtariTones[2];
        document.getElementById('VideoFormatId').value = this.#fields.VideoFormat;
        document.getElementById('TuningMethodId').value = this.#fields.TuningMethod;
        document.getElementById('A4FrequencyId').value = this.#fields.A4Frequency;
        document.getElementById('A4FrequencyRangeId').value = parseInt(this.#fields.A4Frequency);
        document.getElementById('TuningSensitivityId').value = this.#fields.TuningSensitivity;
        document.getElementById('TuningSensitivityRangeId').value = this.#fields.TuningSensitivity;
        document.getElementById('TuningGradientId').checked = this.#fields.TuningGradient;
        document.getElementById('CentTransposeId').value = this.#fields.CentTranspose;
        document.getElementById('CentTransposeRangeId').value = this.#fields.CentTranspose;
        document.getElementById('NumMicroTonesId').value = this.#fields.NumMicroTones;
        document.getElementById('NumMicroTonesRangeId').value = this.#fields.NumMicroTones;
        document.getElementById('PrintBlackKeysId').checked = this.#fields.PrintBlackKeys;
        document.getElementById('PrintGeometryId').checked = this.#fields.PrintGeometry;
        document.getElementById('PrintFrequencyId').checked = this.#fields.PrintFrequency;
        document.getElementById('ShrinkPianoId').checked = this.#fields.ShrinkPiano;
        document.getElementById('JumpToFirstId').checked = this.#fields.JumpToFirst;
        document.getElementById('VolumeId').value = this.#fields.Volume;
        document.getElementById('PolyphonyId').value = this.#fields.Polyphony;
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

    toString() {
        let str = '';
		for (let n in this.#fields)
			str += n + '=' + this.#fields[n] + "\n";
        return str;
    }
}
