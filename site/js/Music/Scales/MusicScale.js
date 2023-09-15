import { Music } from "../Music.js"

// 69 is set by the MIDi standard
const MIDI_A4KEY = 69;

// maps ASCII coded music symbol to HTML entity
// https://www.htmlsymbols.xyz/musical-symbols
const MusicEntities = {
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

// Constructor syntax:
// 	new MusicNote(music, { frequency: float })
// 	new MusicNote(music, { keyNum: integer, microDist: integer })
// 	new MusicNote(music, { key: string })
// Optional:
//  //{ flatNote: MusicNote, sharpNote: MusicNote }
export class MusicNote {
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
    //#flatNote = null;
    //#sharpNote = null;

    constructor(music, args, calculate=true) {
        this.#music = music;

		if (!calculate) {
            this.#frequency = args.frequency;
            this.#microId = args.microId;
            this.#midiNum = args.midiNum;
            this.#microDist = args.microDist;
            this.#keyNum = args.keyNum;
            this.#octave = args.octave;
            this.#key = args.key;
            this.#keyDown = args.keyDown;
            this.#keyUp = args.keyUp;
            this.#isWhite = args.isWhite;
            //this.#flatNote = args.flatNote;
            //this.#sharpNote = args.sharpNote;

		} else if (typeof args.frequency != 'undefined') {
            // allow detuned frequencies
            this.#frequency = args.frequency;
            this.#microId = this.#music.FrequencyToMicroId(args.frequency);
            this.#midiNum = this.#music.FrequencyToMidiNum(args.frequency);
            this.#microDist = this.#music.FrequencyToMicroDist(args.frequency);
			this.#keyNum = this.#music.FrequencyToKeyNum(args.frequency);

		} else if (typeof args.keyNum != 'undefined' && typeof args.microDist != 'undefined') {
        	this.#keyNum = args.keyNum;
        	this.#microDist = args.microDist;
            this.#frequency = this.#music.MicroFrequency(this.#keyNum, this.#microDist);
            this.#microId = this.#music.FrequencyToMicroId(this.#frequency);
            this.#midiNum = this.#music.FrequencyToMidiNum(this.#frequency);

        /*
        // todo: finish, needs conversion to frequency and midiNum
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
            }
        */
		
		} else {
			throw('MusicScale.js: MusicNote.constructor(): incorrect arguments');
		}

        this.#octave = Music.Octave(this.#keyNum);
        this.#key = Music.KeyNumToKey(this.#keyNum);
		this.#keyDown = Music.ToEntities(Music.KeyNumToScaleKey(this.#keyNum, false));
		this.#keyUp = Music.ToEntities(Music.KeyNumToScaleKey(this.#keyNum, true));
        this.#isWhite = Music.KeyNumIsWhite(this.#keyNum);

        //this.#flatNote = (typeof args.flatNote != 'undefined' ? targs.flatNote : null);
        //this.#sharpNote = (typeof args.sharpNote != 'undefined' ? targs.sharpNote : null);
    }

    get Music() { return this.#music }

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
    get Label() { return this.#key + '<sub>' + this.#octave + '.' + this.#microDist  + '</sub>'}	// label for display
    
    // returns previous black flat note if it exists
    getFlatNote() {
        if (this.FlatKey != '')
            return new MusicNote(this.#music, { keyNum: this.KeyNum-1, microDist: this.MicroDist });
        return null;
    }

    // returns next black sharp note if it exists
    getSharpNote() {
        if (this.SharpKey != '')
            return new MusicNote(this.#music, { keyNum: this.KeyNum+1, microDist: this.MicroDist });
        return null;
    }

    // returns rounded frequency
    getFrequencyRounded(precision = null) {
        if (precision === null)
            return Music.Round(this.#frequency, this.#music.FrequencyPrecision);

        return Music.Round(this.#frequency, parseInt(precision));
    }

    #getFields() {
        return {
            'music': this.#music,
            'frequency': this.#frequency,
            'microId': this.#microId,
            'midiNum': this.#midiNum,
            'microDist': this.#microDist,
            'keyNum': this.#keyNum,
            'octave': this.#octave,
            'key': this.#key,
            'keyDown': this.#keyDown,
            'keyUp': this.#keyUp,
            'isWhite': this.#isWhite,
            //'flatNote': this.#flatNote,
            //'sharpNote': this.#sharpNote,
        };
    }

    clone() {
        return new MusicNote(this.#music.clone(), this.#getFields(), false);
    }
}

// produces the scale 88 key keyboards use: keys A0 to C8
export class MusicScale extends Array {
    #music = null;
    #bounds = null;

    #firstOctave = 0;
    #lastOctave = 8;
    #firstKeyNum = 1;
    #lastKeyNum = 88;
    //#firstKeyNum = -50;
    //#lastKeyNum = 115;

    get Music() { return this.#music }

    get FirstOctave() { return this.#firstOctave }
    set FirstOctave(num) { this.#firstOctave = num }

    get LastOctave() { return this.#lastOctave }
    set LastOctave(num) { this.#lastOctave = num }

    get FirstKeyNum() { return this.#firstKeyNum }
    set FirstKeyNum(num) { this.#firstKeyNum = num }

    get LastKeyNum() { return this.#lastKeyNum }
    set LastKeyNum(num) { this.#lastKeyNum = num }

    constructor(music, bounds=null) {
        super();

        if (music == null)
            this.#music = new Music();
        else
            this.#music = music;

        this.#bounds = bounds;
        if (this.#bounds != null) {
            this.FirstKeyNum = this.#bounds.firstKeyNum;
            this.LastKeyNum = this.#bounds.lastKeyNum;
        }
    }

    getNoteList() {
        let ary = [];
        let mid = this.#music.NumMicroTones > 0 ? (this.#music.NumMicroTones-1)/2 : 0;
        let startDistance = 0-Math.floor(mid);	// ...-2, -1, 0
        let endDistance = Math.ceil(mid);		// 0, +1, +2...
        
        console.log(`MusicScale: getNoteList: ${this.FirstKeyNum} to ${this.LastKeyNum}`);
        console.log(this.#bounds);

        for(let keyNum = this.FirstKeyNum; keyNum <= this.LastKeyNum; keyNum++) {
            for(let dist = startDistance; dist <= endDistance; ++dist) {
                let args = { keyNum: keyNum, microDist: dist };
                let note = new MusicNote(this.#music, args);
                ary.push(note);
            }
        }

        return ary;
    }
}
