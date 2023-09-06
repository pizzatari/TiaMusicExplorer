import { MusicScale, MusicNote } from "../Scales/MusicScale.js"
import { SynthInstrument } from "../SynthInstrument.js"

const ToneTypes = ['triangle', 'sine', 'square', 'sawtooth'];
const ToneSet = new Set(ToneTypes);

export class ToneInstrument extends SynthInstrument {
    #audioCtx = null;

    #waveType = ToneTypes[0];
    #frequency = 440.0;

    #audioNodes = [];       // { oscillator: node, oscillator2: node, gain: node }
    #playing = new Map();   // midi number -> audioNodes

    #sustainedNotes = new Map();

    constructor(audioCtx, noteList) {
        super("Tone", noteList);
        this.#audioCtx = audioCtx;

        for (let i = 0; i < super.Polyphony; i++) {
            let node = { oscillator: null, gain: null };
            node.gain = this.#audioCtx.createGain();
            node.gain.connect(this.#audioCtx.destination);
            node.gain.gain.setValueAtTime(0, this.#audioCtx.currentTime); // start muted
            node.oscillator = this.#audioCtx.createOscillator();
            node.oscillator.type = this.#waveType;
            node.oscillator.frequency.value = this.#frequency;
            node.oscillator.connect(node.gain);
            node.oscillator.start();
            this.#audioNodes.push(node);
        }
    }

    get State() { return this.#audioCtx.state }

    getWaveType() { return this.#waveType }

    setWaveType(type) {
	    this.allNotesOff();
        if (ToneSet.has(type)) {
            console.notice(console.stream.synth, "enabling wave " + super.Name);

		    for (let node of this.#audioNodes)
                node.oscillator.type = type;
        }
    }

    enable() {
        console.notice(console.stream.synth, "enabling " + super.Name);
    }

    disable() {
        console.notice(console.stream.synth, "disabling " + super.Name);
    }

    noteOn(midiNote, microDist = 0, velocity = 1.0) {
        if (this.#audioNodes.length == 0) {
            console.notice(console.stream.synth, 'noteOn: polyphony exceeded: ' + midiNote + ' ' + microDist + ' ' + velocity);
            return null;
        }

        let note = this.getNote(midiNote, microDist);
        if (note == null) {
            console.notice(console.stream.synth, 'noteOn: note undefined: ' + midiNote + ' ' + microDist + ' ' + velocity);
            return null;
        }

        if (note.Frequency <= 0.0) {
            console.notice(console.stream.synth, 'noteOn: invalid frequency: ' + midiNote + ' ' + microDist + ' ' + velocity);
            return null;
        }

        let mapKey = this.mapKey(midiNote, microDist);
        let n = this.#playing.get(mapKey);
        if (n != null) {
            console.notice(console.stream.synth, 'noteOn: note currently playing: ' + midiNote + '.' + microDist);
            return note;
        }

        // logarithmic curve
        let effectiveVolume = super.toEffectiveVolume(velocity);
        let currentTime = this.#audioCtx.currentTime + 0.001; //parseInt(this.#audioCtx.currentTime*100)/100;
        //let secsPerCycle = 1/note.Frequency/2;

        let node = this.#audioNodes.shift();
        node.oscillator.frequency.setValueAtTime(note.Frequency, currentTime);
        //node.gain.gain.setTargetAtTime(effectiveVolume, currentTime, 0.005);
        node.gain.gain.setValueAtTime(effectiveVolume, currentTime);
        this.#playing.set(mapKey, node);

        return note;
    }

    noteOff(midiNote, microDist = 0) {
        let mapKey = this.mapKey(midiNote, microDist);

        let node = this.#playing.get(mapKey);
        if (node != null) {
        	//node.gain.gain.setTargetAtTime(0, this.#audioCtx.currentTime, 0.10);
            node.gain.gain.setValueAtTime(0, this.#audioCtx.currentTime);
        	this.#audioNodes.push(node);
        }
        this.#playing.delete(mapKey);

        return this.getNote(midiNote, microDist);
    }

	allNotesOff() {
        for(let [key, node] of this.#playing) {
			this.#audioNodes.push(node);
			this.#playing.delete(key);
		}

		// doing it this way otherwise nodes get put back into the free list while stuck on
		let currentTime = this.#audioCtx.currentTime;
		for (let node of this.#audioNodes) {
        	node.gain.gain.setTargetAtTime(0, currentTime, 0.10);
		}
	}

    sustainOn() {
    }

    sustainOff() {
    }

    microOn(microId, velocity = 1.0) { }
    microOff(microId) { }

    keyOn(keyNote, octave, microDist, velocity = 1.0) { }
    keyOff(keyNote, octave, microDist) { }

    playNote(midiNote, velocity = 1.0, duration = 1.0) { }
    playKey(keyNote, octave, microDist, velocity = 1.0, duration = 1.0) { }

    mapKey(midiNote, microDist) {
        return midiNote + "." + microDist;
    }
}
