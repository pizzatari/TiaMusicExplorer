import { NoteListBuilder } from  "./NoteListBuilder.js" 
import { MusicScale, MusicNote } from "./Scales/MusicScale.js"
import { SynthInstrument } from "./SynthInstrument.js"
import { ToneInstrument } from "./Instruments/ToneInstrument.js"
import { PianoInstrument } from "./Instruments/PianoInstrument.js"
import { TIAInstrument } from "./Instruments/TIAInstrument.js"

export class Synth {
    #audioCtx = null;
    #music = null;
	#args = null;

    #instruments = new Map();
    #scales = new Map();

    #activeInstrument = null;
    #activeScale = null;

    #masterVolume = 1.0;

    constructor(audioContext, music, args = {}) {
        this.#audioCtx = audioContext;
        this.#music = music;
		this.#args = args;

        let pianoNoteList = NoteListBuilder.getPianoNoteList(this.#music);
        let tiaNoteList = NoteListBuilder.getTIANoteList(this.#music, this.#args);

        this.addScale(pianoNoteList);
        this.addScale(tiaNoteList);

        let tone = new ToneInstrument(this.#audioCtx, pianoNoteList);
    	let piano = new PianoInstrument(this.#audioCtx, pianoNoteList);
        let tia = new TIAInstrument(tiaNoteList);

        this.addInstrument(tone);
    	this.addInstrument(piano);
        this.addInstrument(tia);

        this.#activeInstrument = tone;
        this.#activeInstrument.enable();
        this.#activeInstrument.Volume = this.#masterVolume;

        console.notice(console.stream.synth, "Enabled instrument: " + this.ActiveInstrument.Name);
    }

    get AudioContext() { return this.#audioCtx }
    get Instruments() { return this.#instruments.values() }
    get Scales() { return this.#scales.values() }
    get ActiveInstrument() { return this.#activeInstrument }
    get ActiveScale() { return this.#activeScale }

    get MasterVolume() {
        return this.#masterVolume;
    }
    set MasterVolume(vol) {
        vol = Math.max(0.0, vol);
        vol = Math.min(1.0, vol);
        this.#masterVolume = vol;
        this.#activeInstrument.Volume = vol;
    }

    addInstrument(instrument) {
        if (this.#instruments.has(instrument.Name)) {
            let currInstrument = this.#instruments.get(instrument.Name);
            currInstrument.disable();
        }
        this.#instruments.set(instrument.Name, instrument);
    }

    addScale(noteList) {
        this.#scales.set(noteList.Name, noteList);
    }

    enableInstrument(instrumentName) {
        let instrument = this.#instruments.get(instrumentName);
        if (instrument != null) {
            console.notice(console.stream.synth, "enabling instrument " + instrumentName);

            if (!instrument.equals(this.#activeInstrument))
                this.#activeInstrument.disable();

            this.#activeInstrument = instrument;
            this.#activeInstrument.enable();
            this.#activeInstrument.Volume = this.#masterVolume;
        } else {
            console.notice(console.stream.synth, "instrument not found: " + instrumentName);
        }
    }

    enableScale(scaleName) {
        let noteList = this.#scales.get(scaleName);
        if (noteList != null) {
            console.notice(console.stream.synth, "enabling noteList " + scaleName);

            if ( this.ActiveInstrument.Name != 'TIA' ||
                (this.ActiveInstrument.Name == 'TIA' && scaleName == 'TIA')) {

                this.ActiveInstrument.NoteList = noteList;
            }
        } else {
            console.notice(console.stream.synth, "noteList not found: " + scaleName);
        }
    }

    enable() {
        this.#activeInstrument.enable();
	}

    disable() {
        this.#activeInstrument.disable();
	}

    noteOn() {
		return this.#activeInstrument.noteOn(...arguments);
	}

    noteOff() {
		return this.#activeInstrument.noteOn(...arguments);
	}

	allNotesOff() {
		this.#activeInstrument.allNotesOff();
	}

    sustainOn() {
		this.#activeInstrument.sustainOn();
	}

    sustainOff() {
		this.#activeInstrument.keyOn(...arguments);
	}

    keyOn() {
		this.#activeInstrument.keyOn(...arguments);
	}

    keyOff() {
		this.#activeInstrument.keyOff(...arguments);
	}

    playNote() {
		this.#activeInstrument.playNote(...arguments);
	}

    playKey() {
		this.#activeInstrument.playKey(...arguments);
 	}

    mute() {
        this.#activeInstrument.mute();
    }

    volume(vol) {
        this.#activeInstrument.volume(vol);
    }
}
