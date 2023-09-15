import { MusicScale, MusicNote } from "../Scales/MusicScale.js"
import { SynthInstrument } from "../SynthInstrument.js"

const ToneTypes = ['sine', 'triangle', 'square', 'sawtooth'];
const ToneSet = new Set(ToneTypes);

class Node {
    #oscillator = null;
	#gain = null;
}

export class PianoInstrument extends SynthInstrument {
    #audioCtx = null;

    #waveType = ToneTypes[0];
    #frequency = 440.0;

    // fundamental
    #audioNodes = [];       // { oscillator: node, oscillator2: node, gain: node }
    #playing = new Map();   // midi number -> audioNodes

    // 2nd harmonic
    #audioNodes2 = [];      // { oscillator: node, oscillator2: node, gain: node }
    #playing2 = new Map();  // midi number -> audioNodes

    // 3nd harmonic
    #audioNodes3 = [];      // { oscillator: node, oscillator2: node, gain: node }
    #playing3 = new Map();  // midi number -> audioNodes

    #sustainedNotes = new Map();

    constructor(audioCtx, scale) {
        super("Piano", scale);
        this.#audioCtx = audioCtx;

        let gain = this.#audioCtx.createGain();
        gain.connect(this.#audioCtx.destination);

        for (let i = 0; i < super.Polyphony; i++) {
            let node = { oscillator: null, gain: gain };
            node.gain.gain.setValueAtTime(0, this.#audioCtx.currentTime); // start muted
            node.oscillator = this.#audioCtx.createOscillator();
            node.oscillator.type = this.#waveType;
            node.oscillator.frequency.value = this.#frequency;
            node.oscillator.connect(node.gain);
            node.oscillator.start();
            this.#audioNodes.push(node);

/*
            let node2 = { oscillator: null, gain: gain };
            node2.gain.connect(this.#audioCtx.destination);
            node2.gain.gain.setValueAtTime(0, this.#audioCtx.currentTime); // start muted
            node2.oscillator = this.#audioCtx.createOscillator();
            node2.oscillator.type = this.#waveType;
            node2.oscillator.frequency.value = this.#frequency * 2;
            node2.oscillator.connect(node2.gain);
            node2.oscillator.start();
            this.#audioNodes2.push(node2);

            let node3 = { oscillator: null, gain: gain };
            node3.gain.connect(this.#audioCtx.destination);
            node3.gain.gain.setValueAtTime(0, this.#audioCtx.currentTime); // start muted
            node3.oscillator = this.#audioCtx.createOscillator();
            node3.oscillator.type = this.#waveType;
            node3.oscillator.frequency.value = this.#frequency * 3;
            node3.oscillator.connect(node3.gain);
            node3.oscillator.start();
            this.#audioNodes3.push(node3);
*/
		}
/*
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

            let node2 = { oscillator: null, gain: null };
            node2.gain = this.#audioCtx.createGain();
            node2.gain.connect(this.#audioCtx.destination);
            node2.gain.gain.setValueAtTime(0, this.#audioCtx.currentTime); // start muted
            node2.oscillator = this.#audioCtx.createOscillator();
            node2.oscillator.type = this.#waveType;
            node2.oscillator.frequency.value = this.#frequency * 2;
            node2.oscillator.connect(node2.gain);
            node2.oscillator.start();
            this.#audioNodes2.push(node2);

            let node3 = { oscillator: null, gain: null };
            node3.gain = this.#audioCtx.createGain();
            node3.gain.connect(this.#audioCtx.destination);
            node3.gain.gain.setValueAtTime(0, this.#audioCtx.currentTime); // start muted
            node3.oscillator = this.#audioCtx.createOscillator();
            node3.oscillator.type = this.#waveType;
            node3.oscillator.frequency.value = this.#frequency * 3;
            node3.oscillator.connect(node3.gain);
            node3.oscillator.start();
            this.#audioNodes3.push(node3);
        }
*/
    }

    get State() { return this.#audioCtx.state }

    getWaveType() { return this.#waveType }

    setWaveType(type) {
	    this.allNotesOff();
        if (ToneSet.has(type)) {
		    for (let node of this.#audioNodes) {
                node.oscillator.type = type;
                node.stop();
                node.start();
		    }
/*
		    for (let node of this.#audioNodes2) {
                node.oscillator.type = type;
                node.stop();
                node.start();
		    }
		    for (let node of this.#audioNodes3) {
                node.oscillator.type = type;
                node.stop();
                node.start();
		    }
*/
        }
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
        node.gain.gain.setTargetAtTime(effectiveVolume, currentTime, 0.005);
        this.#playing.set(mapKey, node);

/*
        let node2 = this.#audioNodes2.shift();
        node2.oscillator.frequency.setValueAtTime(note.Frequency * 3, currentTime);
        //node2.gain.gain.setTargetAtTime(effectiveVolume/2, currentTime, 0.002);
        this.#playing2.set(mapKey, node2);

        let node3 = this.#audioNodes3.shift();
        node3.oscillator.frequency.setValueAtTime(note.Frequency * 4, currentTime);
        //node3.gain.gain.setTargetAtTime(effectiveVolume/3, currentTime, 0.001);
        this.#playing3.set(mapKey, node3);
*/

        return note;
    }

    noteOff(midiNote, microDist = 0) {
        let mapKey = this.mapKey(midiNote, microDist);

        let node = this.#playing.get(mapKey);
        if (node != null) {
        	node.gain.gain.setTargetAtTime(0, this.#audioCtx.currentTime, 0.20);
        	this.#audioNodes.push(node);
        }

/*
        let node2 = this.#playing2.get(mapKey);
        if (node2 != null) {
        	node2.gain.gain.setTargetAtTime(0, this.#audioCtx.currentTime, 0.10);
        	this.#audioNodes2.push(node2);
        }

        let node3 = this.#playing3.get(mapKey);
        if (node3 != null) {
        	node3.gain.gain.setTargetAtTime(0, this.#audioCtx.currentTime, 0.10);
        	this.#audioNodes3.push(node3);
        }
*/

        this.#playing.delete(mapKey);
        //this.#playing2.delete(mapKey);
        //this.#playing3.delete(mapKey);

        return this.getNote(midiNote, microDist);
    }

	allNotesOff() {
        for(let [key, node] of this.#playing) {
			this.#audioNodes.push(node);
			this.#playing.delete(key);
		}
/*
        for(let [key, node] of this.#playing2) {
			this.#audioNodes2.push(node);
			this.#playing2.delete(key);
		}
        for(let [key, node] of this.#playing3) {
			this.#audioNodes3.push(node);
			this.#playing3.delete(key);
		}
*/

		// doing it this way otherwise nodes get put back into the free list while stuck on
		let currentTime = this.#audioCtx.currentTime;
		for (let node of this.#audioNodes) {
        	node.gain.gain.setTargetAtTime(0, currentTime, 0.10);
		}
/*
		for (let node of this.#audioNodes2) {
        	node.gain.gain.setTargetAtTime(0, currentTime, 0.10);
		}
		for (let node of this.#audioNodes3) {
        	node.gain.gain.setTargetAtTime(0, currentTime, 0.10);
		}
*/
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
