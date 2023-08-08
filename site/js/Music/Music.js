// 69 is set by the MIDi standard
export const MIDI_A4KEY = 69;

// maps ASCII coded music symbol to HTML entity
// https://www.htmlsymbols.xyz/musical-symbols
export const MusicEntities = {
    '##': '&#119082;',  // musical symbol double sharp
    'bb': '&#119083;',  // musical symbol double flat
    'b^': '&#119084;',  // musical symbol flat up
    'bv': '&#119085;',  // musical symbol flat down
    'n^': '&#119086;',  // musical symbol natural up
    'nv': '&#119087;',  // musical symbol natural down
    '#^': '&#119088;',  // musical symbol sharp up
    '#v': '&#119089;',  // musical symbol sharp down
    '#4': '&#119090;',  // musical symbol quarter tone sharp
    'b4': '&#119091;',  // musical symbol quarter tone flat
    'b' : '&flat;',  	// music flat sign
    'n' : '&natur;',    // music natural sign
    '#' : '&sharp;'     // music sharp sign
};

const ScaleDownKeys  = [ 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab' ];
const ScaleUpKeys    = [ 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#' ];

// white = (N % 12) in (1, 3, 4, 6, 8, 9, 11)
// black = (N % 12) in (0, 2, 5, 7, 10)
const WhiteKeys    = { 0:false, 1:true,  2:false, 3:true,  4:true,  5:false,
                       6:true,  7:false, 8:true,  9:true, 10:false, 11:true };

/* Formulas used in this file:

	Frequency formula using semitone distance (d) from A4 frequency (440.0):

                	(d/12)
   	   440.0 Hz * 2
  
	Frequency formula using key num (K) relative to A4 key num (49):

                	(K - A4)/12
   	   440.0 Hz * 2
  
	With microtonal divisions (M):

                	(K*M - A4*M + microDist)/(12*M)
   	   440.0 Hz * 2
  
	With transpose shifting by cent units:

                	((K*M - A4*M + microDist)*100 + cents)/(12*M*100)
   	   440.0 Hz * 2
*/

export class Music {
    #a4KeyNum = 49;
    #a4Frequency = 440.0;		// hertz
    #centTranspose = 0;			// cent units
    #numMicroTones = 1;			// number of micro tone divisions: 1 for normal piano with semitone scale
    #tuningSensitivity = 50.0;	// tolerance for including untuned notes (in cent units 0-50)
    #frequencyPrecision = 2;
    #centPrecision = 2;

	// TODO
    #referenceFrequency = 1.0;	// don't remember what this is for
    #tones = [1];				// this belongs in TIA class

    get A4KeyNum() { return this.#a4KeyNum }
    get A4Frequency() { return this.#a4Frequency }
    get CentTranspose () { return this.#centTranspose }
    get NumMicroTones() { return this.#numMicroTones }
    get TuningSensitivity() { return this.#tuningSensitivity }
    get Tones() { return this.#tones }
    get FrequencyPrecision() { return this.#frequencyPrecision}
    get CentPrecision() { return this.#centPrecision }
    get ReferenceFrequency() { return this.#referenceFrequency }

    set A4KeyNum(key) { this.#a4KeyNum = key }
    set A4Frequency(freq) { this.#a4Frequency = freq }
    set CentTranspose(cents) { this.#centTranspose = cents }
    set NumMicroTones(num) { this.#numMicroTones = num }
    set TuningSensitivity(cents) { this.#tuningSensitivity = cents }
    set Tones(tones) { this.#tones = tones }
    set FrequencyPrecision(intNum) { this.#frequencyPrecision = (intNum > 0 ? parseInt(intNum) : 0) }
    set CentPrecision(intNum) { this.#centPrecision = (intNum > 0 ? parseInt(intNum) : 0) }
    set ReferenceFrequency(freq) { this.#referenceFrequency = freq }

	// returns the tuned note closest to the untuned frequency
    getNearestNote(frequency) {
        let num = this.FrequencyToKeyNum(frequency);
        let dist = this.FrequencyToMicroDist(frequency);
        //return new Note(this, { keyNum: num, microDist: dist });
        return { };
    }

    equals(music) {
        // account for differences in precision, so use the lowest precision.
        let precision = Math.Min(this.FrequencyPrecision, music.FrequencyPrecision);

        if (this.A4KeyNum != music.A4KeyNum)
            return false;
        if (Music.Round(this.A4Frequency, precision) != Music.Round(music.A4Frequency, precision))
            return false;
        if (this.CentTranspose != music.CentTranspose)
            return false;
        if (this.NumMicroTones != music.NumMicroTones)
            return false;
        if (this.TuningSensitivity != music.TuningSensitivity)
            return false;
        if (this.Tones != music.Tones)
            return false;
        if (Music.Round(this.ReferenceFrequency, precision) != Music.Round(music.ReferenceFrequency, precision))
            return false;
        return true;
    }

    KeyNumFrequency(keyNum) {
		// key distance from A4
        let keyDistance = keyNum - this.A4KeyNum;
        let exp = (keyDistance * 100 + this.CentTranspose) / 1200;
        return 2**exp * this.A4Frequency;
	}

    MicroFrequency(keyNum, microDist = 0) {
		// micro distance from A4
        let microDistance = (keyNum * this.NumMicroTones) - (this.A4KeyNum * this.NumMicroTones) + microDist;
        let exp = (microDistance * 100 + this.CentTranspose) / (1200 * this.NumMicroTones);
        return 2**exp * this.A4Frequency;
    }

    MidiFrequency(midiNum) {
		// key distance from A4
        let keyDistance = midiNum - MIDI_A4KEY;
        return 2 ** ((keyDistance * 100 + this.CentTranspose) / 1200) * this.A4Frequency;
    }

    FrequencyToMicroId(freq) {
        return Math.round(this.MicroDistance(Music.Transpose(this.A4Frequency,this.CentTranspose), freq) + (this.A4KeyNum * this.NumMicroTones));
    }

    FrequencyToKeyNum(freq) {
        return Math.round(this.KeyDistance(Music.Transpose(this.A4Frequency,this.CentTranspose), freq) + this.A4KeyNum);
    }

    FrequencyToMidiNum(freq) {
        return Music.KeyNumToMidi(this.FrequencyToKeyNum(freq));
    }

    FrequencyToMicroDist(freq) {
        let microId = this.FrequencyToMicroId(freq);
        let keyNum = this.FrequencyToKeyNum(freq);
        return microId - (keyNum * this.NumMicroTones); 
    }

	KeyDistance(fromFreq, toFreq) {
        return 12 * Math.log2(toFreq/fromFreq);
	}

	MicroDistance(fromFreq, toFreq) {
        return (12 * this.NumMicroTones) * Math.log2(toFreq/fromFreq);
	}

    CentsBetween(fromFreq, toFreq) {
        return fromFreq == 0 ? NaN : Math.log2(toFreq/fromFreq) * 1200;
    }

    MicroOctave(keyNum) {
        return Math.round(((keyNum + 2) * this.NumMicroTones) / (12 * this.NumMicroTones));
    }

    static Octave(keyNum) {
        return Math.round((keyNum + 2) / 12); // begin on C and end on B
    }

    static MidiToKeyNum(midiNum) {
        return midiNum - 20;
    }

    static KeyNumToMidi(keyNum) {
        return keyNum + 20;
    }

    static Transpose(freq, cents) {
        return freq * (2**(cents/1200));
    }

	// returns the letter for a key number. black keys include both flat and sharp letters
	// A, Bb/A#, B, C, Db/C#...
    static KeyNumToKey(keyNum) {
        let idx = (keyNum+11) % 12; // subtract 1 but avoid negative numbers, so +12-1
        let letter = ScaleUpKeys[idx];

        return Music.KeyNumIsWhite(keyNum) ? letter : ScaleDownKeys[idx] + '/' + letter;
    }

	// returns the letter for a key number. a direction is required to disambiguate
	// enharmonic equivalencies between flats and sharps.
	// A, Bb, B, C, Db...	OR   A, A#, B, C, C#...
	//
    // direction = true is moving up the scale, false is moving down
    static KeyNumToScaleKey(keyNum, direction = true) {
        let idx = (keyNum+11) % 12;
        return direction ? ScaleUpKeys[idx] : ScaleDownKeys[idx];
    }

	// returns the flat letter of black keys. blank is returned for white keys.
	// Ab, Bb, Db, Eb, Gb...
    static KeyNumToFlatKey(keyNum) {
        let num = (keyNum+11) % 12;
        return Music.KeyNumIslack(num) ? ScaleDownKeys[num] : '';
    }

	// returns the sharp letter of black keys. blank is returned for white keys.
	// A#, C#, D#, F#, G#...
    static KeyNumToSharpKey(keyNum) {
        let num = (keyNum+1) % 12;
        return Music.KeyNumIsBlack(num) ? ScaleUpKeys[num] : '';
    }

    static KeyNumIsWhite(keyNum) {
        return WhiteKeys[keyNum % 12];
    }

    static KeyNumIsBlack(keyNum) {
        return !WhiteKeys[keyNum % 12];
    }

	// replace ASCII notation with HTML entity
	static Entity(n) {
        return musicEntitities[n] ? MusicEntities[n] : '';
    }

	// replace ASCII notations with HTML entities
    static ToEntities(textString) {
        for(let key in MusicEntities) {
            textString = textString.replace(key, MusicEntities[key]);
        }
        return textString;
    }

	static Round(num, precision) {
    	return Math.round(num * (10**precision)) / (10**precision);
	}

	// serializes this object's values to a delimited string. optionally appends additional values to the end.
    SerializeValues(params = null) {
        let ary = [this.A4KeyNum, this.A4Frequency, this.CentTranspose, this.NumMicroTones, this.TuningSensitivity, this.Tones, this.ReferenceFrequency ];

        if (params != null) {
            for (let [name, value] of params)
                ary.push(value);
        }

        return ary.join(":");
    }
}

/*
// Constructor syntax:
// 	new Note(music, { frequency: float })
// 	new Note(music, { keyNum: integer, microDist: integer })
// 	new Note(music, { key: string })
export class Note {
    #music = null;

    #frequency = 0.0;
    #microId = 0;
    #midiNum = 0;
    #microDist = 0;

    #keyNum = 0;

    #octave = 0;
    #key = '';			// letter key
	#keyDown = '';		// letter key in down direction
	#keyUp = '';		// letter key in up direction
    #isWhite = true;

    constructor(music, args) {
        this.#music = music;

		if (typeof args.frequency != 'undefined') {
            this.#frequency = frequency;

            this.#microId = this.#music.FrequencyToMicroId(this.#frequency);
            this.#midiNum = this.#music.FrequencyToMidiNum(this.#frequency);
            this.#microDist = this.#music.FrequencyToMicroDist(this.#frequency);
			this.#keyNum = this.#music.FrequencyToKeyNum(this.#frequency);

			this.#key = this.#music.KeyNumToKey(this.#keyNum);

		} else if (typeof args.keyNum != 'undefined' && typeof args.microDist != 'undefined') {
        	this.#keyNum = args.keyNum;
        	this.#microDist = args.microDist;

            this.#frequency = this.#music.KeyNumFrequency(this.#keyNum);
            this.#microId = this.#music.FrequencyToMicroId(this.#frequency);
            this.#midiNum = this.#music.FrequencyToMidiNum(this.#frequency);

        } else if (typeof args.key != 'undefined') {
            // formats: A1, A#2, Ab3, A1.-1, A#1.0, Ab1.2
            // double sharps/flats not handled
            const reg = RegExp('^([A-G])([#b]?)([0-9]+)[.]?([-]?[0-9]*)', 'g');
            let result = regex1.exec(arg);
            if (result != null) {
                let key = result[1];
                let accidental = result[2];
                let octave = result[3];
                let microDist = result[4] != null ? result[4] : '0';
                // todo: finish, needs conversion to frequency and midiNum
            }
		
		} else {
			throw('Incorrect arguments to Note constructor');
		}

        this.#octave = this.#music.Octave(this.#keyNum);
        this.#key = this.#music.KeyNumToKey(this.#keyNum);
		this.#keyDown = Music.ToEntities(this.#music.KeyNumToScaleKey(this.#keyNum, false));
		this.#keyUp = Music.ToEntities(this.#music.KeyNumToScaleKey(this.#keyNum, true));
        this.#isWhite = this.#music.KeyNumIsWhite(this.#keyNum);
    }

    get MicroId() { return this.#microId }		// uniquely identifying number (unique by micro number)
    get MidiNum() { return this.#midiNum }		// midi key number: 21-108 (for piano)
    get MicroDist() { return this.#microDist }	// micro distance from piano key: ...-2, -1, 0 (piano key), +1, +2...
    get Frequency() { return this.#frequency }

    get KeyNum() { return this.#keyNum }		// piano key number: 1-88
    get Key() { return this.#key }				// letter of the key: A, B, C... for white keys; F#/Gb, G#/Ab... for black keys
    get KeyDown() { return this.#keyDown }		// letter of the key going up: A, A#, B, C, C#...
    get KeyUp() { return this.#keyUp }			// letter of the key going down: A, Bb, B, C, Db...
    get Octave() { return this.#octave }

    get IsWhite() { return this.#isWhite }
    get IsBlack() { return !this.#isWhite }
    get FlatKey() { return Music.KeyNumToFlatKey(this.#keyNum) }			// letter of black key 1 semitone down; blank if none
    get SharpKey() { return Music.KeyNumToSharpKey(this.#keyNum) }			// letter of black key 1 semitone up; blank if none
    get Label() { return this.#key + this.#octave + "." + this.#microId }	// label for display

    // returns rounded frequency
    getFrequency(precision = null) {
        if (precision === null)
            return Music.Round(this.#frequency, this.#music.FrequencyPrecision);

        return Music.Round(this.#frequency, parseInt(precision));
    }

    centsBetween(toNote) {
        return this.#music.CentsBetween(this.Frequency, toNote.Frequency);
    }

    // returns rounded cents
    getCentsBetween(toNote, precision = null) {
        let cents = this.centsBetween(toNote);

        if (precision === null)
            return Music.Round(cents, this.#music.CentPrecision);

        return Music.Round(cents, parseInt(precision));
    }

    clone(note) {
        return new Note(this.#music, { keyNum: note.KeyNum, microDist: note.MicroDist });
    }
}

// produces the scale 88 key keyboards use: keys A0 to C8
export class MusicScale {
    #music = null;

    #firstOctave = 0;
    #lastOctave = 8;
    #firstKeyNum = 1;
    #lastKeyNum = 88;

    get FirstOctave() { return this.#firstOctave }
    set FirstOctave(num) { this.#firstOctave = num }

    get LastOctave() { return this.#lastOctave }
    set LastOctave(num) { this.#lastOctave = num }

    get FirstKeyNum() { return this.#firstKeyNum }
    set FirstKeyNum(num) { this.#firstKeyNum = num }

    get LastKeyNum() { return this.#lastKeyNum }
    set LastKeyNum(num) { this.#lastKeyNum = num }

    constructor(music) {
        if (music == null)
            this.#music = new Music();
        else
            this.#music = music;
    }

    getNoteList() {
        let ary = [];
        let mid = this.#music.NumMicroTones > 0 ? (this.#music.NumMicroTones-1)/2 : 0;
        let startDistance = 0-Math.floor(mid);	// ...-2, -1, 0
        let endDistance = Math.ceil(mid);		// 0, +1, +2...

        for(let keyNum = this.FirstKeyNum; keyNum <= this.LastKeyNum; keyNum++) {
            for(let dist = startDistance; dist <= endDistance; ++dist) {
                let note = new Note(this.#music, { keyNum: keyNum, microDist: dist });
                ary.push(note);
            }
        }

        return ary;
    }
}
*/
