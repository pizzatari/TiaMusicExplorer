import { MusicScale, MusicNote } from "../Scales/MusicScale.js"
import { SynthInstrument } from "../Synth.js"

const ScaleDownKeys  = [ 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab' ];
const ScaleUpKeys    = [ 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#' ];

// white = (N % 12) in (1, 3, 4, 6, 8, 9, 11)
// black = (N % 12) in (0, 2, 5, 7, 10)
const WhiteKeys    = { 0:false, 1:true,  2:false, 3:true,  4:true,  5:false,
                       6:true,  7:false, 8:true,  9:true, 10:false, 11:true };

export class PianoInstrument extends SynthInstrument {
    #firstOctave = 0;
    #firstNum = 1;
    #lastNum = 88;

    get TypeName() { return "Piano 12-TET" }
    get A4Frequency() { return this.Params.A4Frequency }
    get NumTranspose() { return this.Params.NumTranspose }
    get NumMicroTones() { return this.Params.NumMicroTones }
    get FirstNum() { return this.#firstNum }
    set FirstNum(num) { this.#firstNum = (num >= 0 ? num : 0) }
    get LastNum() { return this.#lastNum }
    set LastNum(num) { this.#lastNum = (num >= 0 ? num : 0) }

    constructor(params = { }) {
        super("Piano", params);
    }

	// play midi note
	noteOn(midiNote, velocity = 1.0) { }
    noteOff(midiNote) { }
    
	// play a letter key (A, C#, Db...)
	keyOn(keyNote, octave, microNum, velocity = 1.0) { }
	keyOff(keyNote, octave, microNum) { }

	// play for a limited duration (seconds)
	playNote(midiNote, velocity = 1.0, duration = 1.0) { }
	playKey(keyNote, octave, microNum, velocity = 1.0, duration = 1.0) { }

	playFrequency(frequency, volume = 1.0, duration = 1.0) { }

    /*
    getNoteList() {
        let ary = [];
        let mid = this.NumMicroTones > 0 ? (this.NumMicroTones-1)/2 : 0;
        let start = 0-Math.floor(mid);
        let end = Math.ceil(mid);

        for(let keyNum = this.#firstNum; keyNum <= this.#lastNum; keyNum++) {
            for(let microNum = start; microNum <= end; ++microNum) {
                let note = new Note(keyNum, microNum);
                ary.push(note);
            }
        }

        return ary;
    }
    */
}

/*
export class PianoNote extends Note {
    #keyNum = 0;
    #microNum = 0;
    #key = '';
    #octave = 0;
    #isWhite = true;

    constructor(keyNum, microNum) {
        super(Music.MicroFrequency(keyNum, microNum));

        this.#keyNum = keyNum;
        this.#microNum = microNum;
        this.#key = Music.NumToKey(keyNum);
        this.#octave = Music.Octave(keyNum);
        this.#isWhite = Music.NumIsWhite(keyNum);
    }

    get Label() { return this.Key; }

    get KeyNum() { return this.#keyNum }
    get MicroNum() { return this.#microNum }
    get Key() { return this.#key }
    get FlatKey() { return Music.NumToFlatKey(this.#keyNum) }
    get SharpKey() { return Music.NumToSharpKey(this.#keyNum) }
    get Octave() { return this.#octave }

    get IsWhite() { return this.#isWhite }
    get IsBlack() { return !this.#isWhite }

    centsBetween(toNote) {
        return Music.Cents(this.Frequency, toNote.Frequency);
    }

    clone(note) {
        return new PianoNote(note.KeyNum, note.MicroNum);
    }
}
*/

/*
const Sharp             = '♯';
const Flat              = '♭';
const Natural           = '♮';
const Accidentals       = { '#':Sharp, 'b':Flat, 'n':Natural };

const FlatKeys       = { "A": "Ab", "B": "Bb", "D": "Db", "E": "Eb", "G": "Gb" };
const SharpKeys      = { "A": "A#", "C": "C#", "D": "D#", "F": "F#", "G": "G#" };
const NoteKeys       = [ 'A', 'B', 'C', 'D', 'E', 'F', 'G' ];

const majorChords = new Set([
    "CEG",
    "C#FG#",
    "DbFAb",
    "DF#A",
    "D#GA#",
    "EbGBb",
    "EG#B",
    "FAC",
    "F#A#C#",
    "GbBbDb",
    "GBD",
    "G#CD#",
    "AbCEb",
    "AC#E",
    "A#DF",
    "BbDF",
    "BD#F#"
]);
*/

