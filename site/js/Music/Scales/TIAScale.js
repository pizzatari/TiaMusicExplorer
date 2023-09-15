import { Music } from "../Music.js"
import { MusicScale, MusicNote } from "../Scales/MusicScale.js"

// NoteFrequency = OscillatorRate / ColorClocks / WaveformLength / NoteValue
// https://forums.atariage.com/topic/257526-musicsound-programming-question-atari-2600/

// average color clocks per audio clock is an average of alternating values between 112 and 116
const COLOR_CLOCKS_PER_LINE		 = 228;
const AVG_COLOR_CLOCKS_PER_AUDIO = COLOR_CLOCKS_PER_LINE/2;	// color clocks per audio clock

// Atari 2600 NTSC crystal clock (C015510). This differs slightly from the computed
// NTSC frequency: 315/88*1000*1000 = 3.579545 MHz
const NTSC_FREQ = 3.579575 * 1e6;

// Atari 2600 PAL crystal clock (CO16112). This differs slightly from the computed
// PAL frequency: 283.75*15625*4/5+25 = 3.546900 MHz
const PAL_FREQ = 3.546894 * 1e6;

export class NTSCMode {
    #frequency      = NTSC_FREQ;
    #cpuFrequency   = NTSC_FREQ/3;
    #audioFrequency = NTSC_FREQ/AVG_COLOR_CLOCKS_PER_AUDIO;
    #fps            = 60/1.001; // fields per second

    get Name() { return "ntsc" }
    get Frequency() { return this.#frequency }
    get FPS() { return this.#fps }
    get CpuFrequency() { return this.#cpuFrequency }
    get AudioFrequency () { return this.#audioFrequency }
}

export class PALMode {
    #frequency      = PAL_FREQ;
    #cpuFrequency   = PAL_FREQ/3;
    #audioFrequency = PAL_FREQ/AVG_COLOR_CLOCKS_PER_AUDIO;
    #fps            = 50; // fields per second

    get Name() { return "pal" }
    get Frequency() { return this.#frequency }
    get FPS() { return this.#fps }
    get CpuFrequency() { return this.#cpuFrequency }
    get AudioFrequency () { return this.#audioFrequency }
}

export const ModeMap = {
    'ntsc': new NTSCMode(),
    'pal': new PALMode()
};

export const Divisors = [
//     AUDC control value (0 and 11 are silent)
//  0   1    2    3  4  5   6   7    8   9  10 11 12 13  14  15
    1, 15, 465, 465, 2, 2, 31, 31, 511, 31, 31, 1, 6, 6, 93, 93
];

export class TIANote extends MusicNote {
	#videoMode = null;
	#audc = 0;
	#audf = 0;
	#cents = 0.0;

    #tones = [1, 2, 3, 4, 5, 7, 8, 9, 12, 13, 14, 15];
    #allTones = Array(16).fill(0).map((e,i) => { return 15 - i });
    #allPitches = Array(32).fill(0).map((e,i) => { return 31 - i });

    #nearestNote = null;

    constructor(music, videoMode, audc, audf) {
        audc = (audc >= 0 && audc < 16) ? audc : 0;
        audf = (audf >= 0 && audf < 32) ? audf : 0;

        let tiaFrequency = videoMode.AudioFrequency / Divisors[audc] / (audf+1);
        super(music, { frequency: tiaFrequency }, true);
		this.#videoMode = videoMode;
        this.#audc = audc;
        this.#audf = audf;
        this.#nearestNote = new MusicNote(super.Music, { keyNum: super.KeyNum, microDist: super.MicroDist });
        this.#cents = Music.CentsBetween(this.#nearestNote.Frequency, tiaFrequency);
    }

    get VideoMode() { return this.#videoMode }
	get AUDC() { return this.#audc }
	get AUDF() { return this.#audf }
	get Cents() { return this.#cents }
    get TIALabel() { return "" + this.AUDC + "/" + this.AUDF }

	getCentsRounded(precision = null) {
        if (precision === null)
            return Music.Round(this.Cents, super.Music.FrequencyPrecision);

        return Music.Round(this.Cents, parseInt(precision));
	}

    clone() {
        return new TIANote(super.Music.clone(), this.VideoMode, this.AUDC, this.AUDF); 
    }

    computeFrequency(audc, audf) {
        if (audc < 0 || audc >= 16 || audf < 0 || audf >= 32)
            return 0.0;

        return this.VideoMode.AudioFrequency / Divisors[audc] / (audf+1);
    }

    getNearestMusicNote() {
        return this.#nearestNote;
    }
}

export class TIAScale extends MusicScale {
	#videoMode = ModeMap.ntsc;
	#audc = 0;

    #bounds = {
        firstMicroId: Number.MAX_VALUE, lastMicroId: -Number.MAX_VALUE,
        firstMidiNum: Number.MAX_VALUE, lastMidiNum: -Number.MAX_VALUE,
        firstKeyNum:  Number.MAX_VALUE, lastKeyNum:  -Number.MAX_VALUE,
    };

    constructor(music, modeStr, audc) {
        super(music);
		this.#audc = audc;
		if (modeStr != '')
			this.setModeByString(modeStr);

		let minFreq = this.MinFrequency;
		this.#bounds.firstMicroId = music.FrequencyToMicroId(minFreq);
		this.#bounds.firstMidiNum = music.FrequencyToMidiNum(minFreq);
		this.#bounds.firstKeyNum = music.FrequencyToKeyNum(minFreq);

		let maxFreq = this.MaxFrequency;
		this.#bounds.lastMicroId = music.FrequencyToMicroId(maxFreq);
		this.#bounds.lastMidiNum = music.FrequencyToMidiNum(maxFreq);
		this.#bounds.lastKeyNum = music.FrequencyToKeyNum(maxFreq);
    }

	get VideoMode() { return this.#videoMode };
	get AUDC() { return this.#audc }

    get MaxFrequency() { return this.VideoMode.AudioFrequency / Divisors[this.AUDC] / 1 }
    get MinFrequency() { return this.VideoMode.AudioFrequency / Divisors[this.AUDC] / 32 }

    get Bounds() { return this.#bounds }

    setModeByString(str) {
        if (typeof ModeMap[str] != 'undefined')
            this.#videoMode = ModeMap[str];
	}

    getNoteList() {
        let ary = [];

        for (let audf = 31; audf >= 0; audf--)
            ary.push(new TIANote(super.Music, this.VideoMode, this.AUDC, audf));

        return ary;
    }
}
