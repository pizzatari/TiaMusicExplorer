import { NoteListBuilder } from  "./NoteListBuilder.js" 
import { MusicScale, MusicNote } from "./Scales/MusicScale.js"
import { SynthInstrument } from "./SynthInstrument.js"
import { ToneInstrument } from "./Instruments/ToneInstrument.js"
import { PianoInstrument } from "./Instruments/PianoInstrument.js"
import { TIAInstrument } from "./Instruments/TIAInstrument.js"

export class Synth {
    #audioCtx = null;
    #music = null;
	#instrumentArgs = null;

    #instruments = new Map();
    #scales = new Map();

    #activeInstrument = null;
    #activeScale = null;

    #masterVolume = 1.0;

	/* instrumentArgs { audc: [0-15] } */
    constructor(audioContext, music, instrumentArgs = {}) {
        this.#audioCtx = audioContext;
        this.#music = music;
		this.#instrumentArgs = instrumentArgs;

		this.restart();

        console.notice(console.stream.synth, "API initialized");
        console.notice(console.stream.synth, "active instrument:" + this.ActiveInstrument.Name);
    }

    get AudioContext() { return this.#audioCtx }
    get Instruments() { return this.#instruments.values() }
    get ActiveInstrument() { return this.#activeInstrument }

    get MasterVolume() {
        return this.#masterVolume;
        //return this.ActiveInstrument.Volume;
    }
    set MasterVolume(vol) {
        vol = Math.max(0.0, vol);
        vol = Math.min(1.0, vol);
        this.#masterVolume = vol;
        this.#activeInstrument.Volume = vol;
    }

    /*
    get MasterVolume() {
        return this.#masterVolume
    }
    set MasterVolume(vol) {
        this.#masterVolume = vol;
        this.#activeInstrument.Volume = vol;
    }
    */

    restart() {
		for (let [name, instrument] of this.#instruments)
			instrument.disable();

		this.#instruments.clear()
		this.#scales.clear()

        let pianoNotes = NoteListBuilder.getPianoNotes(this.#music);
    	let tiaList = NoteListBuilder.getTIANotes(this.#music, this.#instrumentArgs);

        let tone = new ToneInstrument(this.#audioCtx, pianoNotes);
    	let piano = new PianoInstrument(this.#audioCtx, pianoNotes);
    	let tia = new TIAInstrument(tiaList);

        this.addInstrument(tone);
    	this.addInstrument(piano);
    	this.addInstrument(tia);

        this.#activeInstrument = tone;
        this.#activeInstrument.enable();
        this.#activeInstrument.Volume = this.#masterVolume;
    }

    addInstrument(instrument) {
        if (this.#instruments.has(instrument.Name)) {
            console.notice(console.stream.synth, "replacing " + instrument.Name);
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
            console.notice(console.stream.synth, "replacing scale " + scale.Name);
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

/*
export class SynthInstrument {
    #name = null;
    #volume = 1.0;
    #polyphony = 10;
    #polyphonyLocked = false;
    #midiMap = new Map();   // midiNum -> Note
    #keyMap = new Map();    // keyNum -> Note
    
    #slotsFree = [];
    #slotsActive = new Map();

    constructor(name, noteList=null) {
        this.#name = name;

        if (noteList != null)
            this.setNoteList(noteList);
    }

    setNoteList(noteList) {
        this.#midiMap.clear();
        this.#keyMap.clear();
        for (let note of noteList) {
            let key = this.Key(note.MidiNum, note.MicroDist);
            this.#midiMap.set(key, note);
            this.#keyMap.set(note.KeyNum, note);
        }
    }

    set Name(val) { this.#name = val }
    get Name() { return this.#name }

    set Volume(val) { this.#volume = val }
    get Volume() { return this.#volume }

    get Polyphony() { return this.#polyphony }
    set Polyphony(val) {
        if (!this.#polyphonyLocked && val > 0 && val <= 16)
            this.#polyphony = val;
    }

    set PolyphonyLocked(val) { this.#polyphonyLocked = true }
    get PolyphonyLocked() { return this.#polyphonyLocked }

    set MidiMap(map) { this.#midiMap = map }
    get MidiMap() { this.#midiMap = map }

    set Slots(slotsAry) { this.#slotsFree = slotsAry }
    get SlotsPlaying() { return this.#slotsActive }

    getNote(midiNum, microDist = 0) {
        let key = this.Key(midiNum, microDist);
        let note = this.#midiMap.get(key);
        return typeof note == 'undefined' ? null : note;
    }

    getSlot(id) {
        if (this.#slotsFree.length > 0) {
            let slot = this.#slotsFree.pop();
            this.#slotsActive.set(id, slot);
            return slot;
        }

        return null;
    }

    getActiveSlot(id) {
        let slot = this.#slotsActive.get(id);
        return typeof slot != 'undefined' ? slot : null;
    }

    numSlotsFree() {
        return this.#slotsFree.length;
    }

    freeSlot(id) {
        if (this.#slotsActive.has(id)) {
            let slot = this.#slotsActive.get(id);
            this.#slotsFree.push(slot);
            this.#slotsActive.delete(id);
        }
    }

    freeAllSlots() {
        for(let [id, slot] of this.#slotsActive) {
            this.#slotsFree.push(slot);
        }
        this.#slotsActive.clear();
        //this.#slotsFree.push(this.#slotsActive.values());
        //this.#slotsActive.clear();
    }   

    Key(midiNum, microDist) {
        return midiNum + '_' + microDist;
    }

    equals(instrument) {
        if (instrument != null)
            return this.Name == instrument.Name;
        return false;
    }

    enable() { }
    disable() { }

    // play midi note
    noteOn(midiNote, velocity = 1.0) { }
    noteOff(midiNote) { }

    sustainOn() { }
    sustainOff() { }
    
    // play a letter key (A, C#, Db ...)
    // micronum (... -1, 0, 1 ...), 0 is normal piano note
    keyOn(keyNote, octave, microDist = 0, velocity = 1.0) { }
    keyOff(keyNote, octave, microDist = 0) { }

    // play for a limited duration (seconds)
    playNote(midiNote, velocity = 1.0, duration = 1.0) { }
    playKey(keyNote, octave, microDist = 0, velocity = 1.0, duration = 1.0) { }

    mute() {
        this.Volume = 0.0;
    }

    volume(val) {
        if (val >= 0.0 && val <= 1.0)
            this.Volume = val;
    }
}

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
        let effectiveVolume = super.Volume * Math.log2(velocity+1.0);
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
*/
        /*
        const realAry = [1, 0, 1, 0.5, 0, 0];
        const imagAry = [1, 0, 0, 0, 0.5, 1];
        const real = new Float32Array(2);
        const imag = new Float32Array(2);
        //const ac = new AudioContext();
        //const osc = ac.createOscillator();
        for (let i = 0; i < realAry.length; i++) {
            real[i] = realAry[i];
            imag[i] = imagAry[i];
        }
        const wave = this.#audioCtx.createPeriodicWave(real, imag, { disableNormalization: true });
        //osc.setPeriodicWave(wave);
        //osc.connect(ac.destination);
        //osc.start();
        //osc.stop(5);
        //*/

		/*
		function makeDistortionCurve(amount) {
   		  	const k = typeof amount === "number" ? amount : 50;
  		  	//const n_samples = 44100;
  		  	const n_samples = 10000;
  		  	const curve = new Float32Array(n_samples);
  		  	const deg = Math.PI / 180;

  		  	for (let i = 0; i < n_samples; i++) {
				const x = (i * 2) / n_samples - 1;
				curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
				//curve[i] = Math.random();
  		  	}
  		  	return curve;
		}

		function makeDistortionCurve2(amount=20) {
    		let n_samples = 256, curve = new Float32Array(n_samples);
    		for (let i = 0 ; i < n_samples; ++i ) {
        		let x = i * 2 / n_samples - 1;
        		curve[i] = (Math.PI + amount) * x / (Math.PI + amount * Math.abs(x));
    		}
    		return curve;
		} 

		const distortion = this.#audioCtx.createWaveShaper();
		distortion.curve = makeDistortionCurve2();
		//distortion.oversample = "4x";
	 	*/

