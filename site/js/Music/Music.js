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
    'b' : '&flat;',     // music flat sign
    'n' : '&natur;',    // music natural sign
    '#' : '&sharp;'     // music sharp sign
};

const ScaleDownKeys  = [ 'A', 'Bb', 'B', 'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab' ];
const ScaleUpKeys    = [ 'A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#' ];

// white = (N % 12) in (1, 3, 4, 6, 8, 9, 11)
// black = (N % 12) in (0, 2, 5, 7, 10)
const WhiteKeys = [ true, false, true, true, false, true, false, true, true, false, true, false ];
/* const WhiteKeys = { 0:false, 1:true,  2:false, 3:true,  4:true,  5:false,
                       6:true,  7:false, 8:true,  9:true, 10:false, 11:true }; */

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

export class Music extends EventTarget {
    #a4KeyNum = 49;
    #a4Frequency = 440.0;       // hertz
    #centTranspose = 0;         // cent units
    #numMicroTones = 1;         // number of micro tone divisions: 1 for normal piano with semitone scale
    #tuningSensitivity = 50.0;  // tolerance for including untuned notes (in cent units 0-50)
    #frequencyPrecision = 2;
    #centPrecision = 2;

    // TODO
    #referenceFrequency = 1.0;  // don't remember what this is for
    #tones = [1];               // this belongs in TIA class

    get A4KeyNum() { return this.#a4KeyNum }
    get A4Frequency() { return this.#a4Frequency }
    get CentTranspose () { return this.#centTranspose }
    get NumMicroTones() { return this.#numMicroTones }
    get TuningSensitivity() { return this.#tuningSensitivity }
    get Tones() { return this.#tones }
    get FrequencyPrecision() { return this.#frequencyPrecision}
    get CentPrecision() { return this.#centPrecision }
    get ReferenceFrequency() { return this.#referenceFrequency }

    set A4KeyNum(key) {
        this.#a4KeyNum = key;
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set A4Frequency(freq) {
        this.#a4Frequency = freq;
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set CentTranspose(cents) {
        this.#centTranspose = cents;
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set NumMicroTones(num) {
        this.#numMicroTones = num;
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set TuningSensitivity(cents) {
        this.#tuningSensitivity = cents;
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set Tones(tones) {
        this.#tones = tones;
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set FrequencyPrecision(intNum) {
        this.#frequencyPrecision = (intNum > 0 ? parseInt(intNum) : 0);
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set CentPrecision(intNum) {
        this.#centPrecision = (intNum > 0 ? parseInt(intNum) : 0);
        //super.dispatchEvent(new Event("musicupdate"));
    }
    set ReferenceFrequency(freq) {
        this.#referenceFrequency = freq;
        //super.dispatchEvent(new Event("musicupdate"));
    }

    setFields(fields) {
        if (fields.A4KeyNum != null)
            this.#a4KeyNum = fields.A4KeyNum;
        if (fields.A4Frequency != null)
            this.#a4Frequency = fields.A4Frequency; 
        if (fields.CentTranspose != null)
            this.#centTranspose = fields.CentTranspose; 
        if (fields.NumMicroTones != null)
            this.#numMicroTones = fields.NumMicroTones; 
        if (fields.TuningSensitivity != null)
            this.#tuningSensitivity = fields.TuningSensitivity; 
        if (fields.FrequencyPrecision != null)
            this.#frequencyPrecision = fields.FrequencyPrecision; 
        if (fields.CentPrecision != null)
            this.#centPrecision = fields.CentPrecision;
        //super.dispatchEvent(new Event("musicupdate"));
    }

    constructor() {
        super();
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

    MicroOctave(keyNum) {
        return Math.round(((keyNum + 2) * this.NumMicroTones) / (12 * this.NumMicroTones));
    }

    static CentsBetween(fromFreq, toFreq) {
        return fromFreq == 0 ? NaN : Math.log2(toFreq/fromFreq) * 1200;
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
        //let idx = (keyNum+11) % 12; // subtract 1 but avoid negative numbers, so +12-1
        let idx = Music.Modulo(keyNum-1, 12);
        let letter = ScaleUpKeys[idx];
        return Music.KeyNumIsWhite(keyNum) ? letter : ScaleDownKeys[idx] + '/' + letter;
    }

    // returns the letter for a key number. a direction is required to disambiguate
    // enharmonic equivalencies between flats and sharps.
    // A, Bb, B, C, Db...    OR   A, A#, B, C, C#...
    //
    // direction = true is moving up the scale, false is moving down
    static KeyNumToScaleKey(keyNum, direction = true) {
        //let idx = (keyNum+11) % 12;
        let idx = Music.Modulo(keyNum-1, 12);
        return direction ? ScaleUpKeys[idx] : ScaleDownKeys[idx];
    }

    // returns the flat letter of black keys. blank is returned for white keys.
    // Ab, Bb, Db, Eb, Gb...
    static KeyNumToFlatKey(keyNum) {
        //let num = (keyNum+11) % 12;
        let idx = Music.Modulo(keyNum-2, 12);
        return Music.KeyNumIsBlack(keyNum-1) ? ScaleDownKeys[idx] : '';
    }

    // returns the sharp letter of black keys. blank is returned for white keys.
    // A#, C#, D#, F#, G#...
    static KeyNumToSharpKey(keyNum) {
        //let num = (keyNum+1) % 12;
        let idx = Music.Modulo(keyNum, 12);
        return Music.KeyNumIsBlack(keyNum+1) ? ScaleUpKeys[idx] : '';
    }

    static KeyNumIsWhite(keyNum) {
        let idx = Music.Modulo(keyNum-1, 12);
        return WhiteKeys[idx];
    }

    static KeyNumIsBlack(keyNum) {
        let idx = Music.Modulo(keyNum-1, 12);
        return !WhiteKeys[idx];
    }

    // replace ASCII notation with HTML entity
    static Entity(n) {
        return musicEntitities[n] ? MusicEntities[n] : '';
    }

    // replace ASCII notations with HTML entities
    static ToEntities(textString) {
        if (textString == null)
            console.log("textString null");

        for(let key in MusicEntities) {
            textString = textString.replace(key, MusicEntities[key]);
        }
        return textString;
    }

    static Round(num, precision) {
        return Math.round(num * (10**precision)) / (10**precision);
        //return num.toFixed(precision);
    }

    // modulo that works with negative numbers (javascript % does not)
    static Modulo(num, modulus) {
        // I know of two different solutions: 

        // my version
        //return num - (Math.floor(num / modulus) * modulus);

        // this version should be faster if % has O(1) complexity
        return ((num % modulus) + modulus) % modulus;
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
