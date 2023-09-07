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

        let pianoNotes = NoteListBuilder.getPianoNotes(this.#music, this.#args.bounds);
        let tiaList = NoteListBuilder.getTIANotes(this.#music, this.#args);

        let tone = new ToneInstrument(this.#audioCtx, pianoNotes);
    	let piano = new PianoInstrument(this.#audioCtx, pianoNotes);
        let tia = new TIAInstrument(tiaList);

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
    get ActiveInstrument() { return this.#activeInstrument }

    get MasterVolume() {
        return this.#masterVolume;
    }
    set MasterVolume(vol) {
        vol = Math.max(0.0, vol);
        vol = Math.min(1.0, vol);
        this.#masterVolume = vol;
        this.#activeInstrument.Volume = vol;
    }

    /*
    restart() {
		for (let [name, instrument] of this.#instruments)
			instrument.disable();

		this.#instruments.clear()
		this.#scales.clear()

        let pianoNotes = NoteListBuilder.getPianoNotes(this.#music, this.#args.Bounds);

        let tone = new ToneInstrument(this.#audioCtx, pianoNotes);
        this.addInstrument(tone);

    	let piano = new PianoInstrument(this.#audioCtx, pianoNotes);
    	this.addInstrument(piano);

    	//let tiaList = NoteListBuilder.getTIANotes(this.#music, this.#args);
    	//let tia = new TIAInstrument(tiaList);
    	//this.addInstrument(tia);

        this.#activeInstrument = tone;
        this.#activeInstrument.enable();
        this.#activeInstrument.Volume = this.#masterVolume;
    }
    */

    addInstrument(instrument) {
        if (this.#instruments.has(instrument.Name)) {
            console.notice(console.stream.synth, "replacing instrument with" + instrument.Name);
            let currInstrument = this.#instruments.get(instrument.Name);
            currInstrument.disable();
        }
        this.#instruments.set(instrument.Name, instrument);
    }

    enableInstrument(name) {
        let instrument = this.#instruments.get(name);
        if (instrument != null) {
            console.notice(console.stream.synth, "enabling instrument " + name);

            if (!instrument.equals(this.#activeInstrument))
                this.#activeInstrument.disable();

            this.#activeInstrument = instrument;
            this.#activeInstrument.enable();
            this.#activeInstrument.Volume = this.#masterVolume;
        } else {
            console.notice(console.stream.synth, "instrument not found: " + name);
        }
    }

    addScale(scale) {
        if (this.#scales.has(scale.Name)) {
            console.notice(console.stream.synth, "replacing scale with " + scale.Name);
            let currScale = this.#scales.get(scale.Name);
            currScale.disable();
        }
        this.#scales.set(scale.Name, scale);
    }

    enableScale(name) {
        let scale = this.#scales.get(name);
        if (scale != null) {
            console.notice(console.stream.synth, "enabling scale " + name);

            if (!scale.equals(this.#activeScale)) {
                console.notice(console.stream.synth, "replacing active scale " + name);
                this.#activeScale.disable();
            }

            this.#activeScale = scale;
            this.#activeScale.enable();
            this.#activeScale.Volume = this.MasterVolume;
        } else {
            console.notice(console.stream.synth, "scale not found: " + name);
        }
    }

    pause() {
        this.#activeInstrument.pause();
    }

    resume() {
        this.#activeInstrument.resume();
    }

    disable() {
        this.#activeInstrument.disable();
    }

    mute() {
        this.#activeInstrument.mute();
    }

    volume(vol) {
        this.#activeInstrument.volume(vol);
    }
}
