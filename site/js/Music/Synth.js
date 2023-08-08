import { NoteListBuilder } from  "./NoteListBuilder.js" 
import { MusicScale, MusicNote } from "./Scales/MusicScale.js"

export class Synth {
    #instruments = new Map();
    #activeInstrument = null;
    #masterVolume = 1.0;
    #audioCtx = null;

    constructor(music, instrumentAry = null) {
        this.#audioCtx = new AudioContext();
        console.log("Web Audio API initialized");

        let noteList = NoteListBuilder.getPianoNotes(music);

        let toneInstrument = new ToneInstrument(this.#audioCtx, noteList);
        this.addInstrument(toneInstrument);
        this.#activeInstrument = toneInstrument;
        this.#activeInstrument.enable();

        if (Array.isArray(instrumentAry)) {
            for (const i of instrumentAry) {
                if (i.Name != 'Tone')
                    this.addInstrument(instrumentAry);
            }
        }

    }

    get ActiveInstrument() { return this.#activeInstrument }
    get MasterVolume() { return this.#masterVolume }
    get AudioContext() { return this.#audioCtx }

    addInstrument(instrument) {
        this.#instruments.set(instrument.Name, instrument);
    }

    enable(name) {
        let instrument = this.#instruments.get(name);
        if (instrument != null) {
            if (!instrument.equals(this.#activeInstrument))
                this.#activeInstrument.disable();

            this.#activeInstrument = instrument;
            this.#activeInstrument.enable();
            this.#activeInstrument.Volume = this.MasterVolume;
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

export class SynthInstrument {
    #name = null;
    #volume = 1.0;
    #polyphony = 10;
    #midiMap = new Map();    // midiNote -> Note
    #keyMap = new Map();    // keyNum -> Note

    constructor(name, noteList) {
        this.#name = name;
        this.setNoteList(noteList);
    }

    setNoteList(noteList) {
        this.disable();
        for (let note of noteList) {
            let key = this.#key(note.MidiNum, note.MicroDist);
            this.#midiMap.set(key, note);
            this.#keyMap.set(note.KeyNum, note);
        }
        this.enable();
    }

    set Name(val) { this.#name = val }
    get Name() { return this.#name }

    set Volume(val) { this.#volume = val }
    get Volume() { return this.#volume }

    get Polyphony() { return this.#polyphony }
    set Polyphony(val) {
        if (val > 0 && val <= 16)
            this.#polyphony = val;
    }

    set MidiMap(map) { this.#midiMap = map }
    get MidiMap() { this.#midiMap = map }

    getNote(midiNum, microDist = 0) {
        let key = this.#key(midiNum, microDist);
        return this.#midiMap.get(key);
    }

    #key(midiNum, microDist) {
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

export class ToneInstrument extends SynthInstrument {
    #audioCtx = null;

    #waveType = 'square';   // 'sine', 'square', 'sawtooth', 'triangle', 'custom'
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
            node3.oscillator.frequency.value = this.#frequency * 2;
            node3.oscillator.connect(node3.gain);
            node3.oscillator.start();
            this.#audioNodes3.push(node3);
        }
    }

    get State() { return this.#audioCtx.state }

    noteOn(midiNote, microDist = 0, velocity = 1.0) {
        if (this.#audioNodes.length == 0) {
            console.log('noteOn: polyphony exceeded: ' + midiNote + ' ' + microDist + ' ' + velocity);
            return null;
        }

        let note = this.getNote(midiNote, microDist);
        if (note == null) {
            console.log('noteOn: note undefined: ' + midiNote + ' ' + microDist + ' ' + velocity);
            return null;
        }

        let mapKey = this.mapKey(midiNote, microDist);
        let n = this.#playing.get(mapKey);
        if (n != null) {
            console.log('noteOn: note currently playing: ' + midiNote + '.' + microDist);
            return note;
        }

        if (note.Frequency <= 0.0) {
            console.log('noteOn: invalid frequency: ' + midiNote + ' ' + microDist + ' ' + velocity);
            return null;
        }

        // logarithmic curve
        let effectiveVolume = super.Volume * Math.log2(velocity+1.0);

        let node = this.#audioNodes.pop();
        node.oscillator.frequency.setValueAtTime(note.Frequency, this.#audioCtx.currentTime);
        node.gain.gain.setTargetAtTime(effectiveVolume, this.#audioCtx.currentTime, 0.005);
        this.#playing.set(mapKey, node);

        let node2 = this.#audioNodes2.pop();
        node2.oscillator.frequency.setValueAtTime(note.Frequency * 2, this.#audioCtx.currentTime);
        node2.gain.gain.setTargetAtTime(effectiveVolume/2, this.#audioCtx.currentTime, 0.005);
        this.#playing2.set(mapKey, node2);

        let node3 = this.#audioNodes3.pop();
        node3.oscillator.frequency.setValueAtTime(note.Frequency * 3, this.#audioCtx.currentTime);
        node3.gain.gain.setTargetAtTime(effectiveVolume/3, this.#audioCtx.currentTime, 0.005);
        this.#playing3.set(mapKey, node3);

        return note;
    }

    noteOff(midiNote, microDist = 0) {
        if (this.#playing.size == 0) {
            console.log('noteOff: nothing is playing: ' + midiNote + '.' + microDist);
            return null;
        }

        let mapKey = this.mapKey(midiNote, microDist);
        let node = this.#playing.get(mapKey);
        let node2 = this.#playing2.get(mapKey);
        let node3 = this.#playing3.get(mapKey);

        if (node == null) {
            console.log('noteOff: note is not playing: ' + midiNote + '.' + microDist);
            return null;
        }

        node.gain.gain.setTargetAtTime(0, this.#audioCtx.currentTime, 0.0005);
        node2.gain.gain.setTargetAtTime(0, this.#audioCtx.currentTime, 0.0005);
        node3.gain.gain.setTargetAtTime(0, this.#audioCtx.currentTime, 0.0005);

        node.oscillator.frequency.value = this.#frequency;
        node2.oscillator.frequency.value = this.#frequency;
        node3.oscillator.frequency.value = this.#frequency;

        this.#playing.delete(mapKey);
        this.#audioNodes.push(node);

        this.#playing2.delete(mapKey);
        this.#audioNodes2.push(node2);

        this.#playing3.delete(mapKey);
        this.#audioNodes3.push(node3);

        return this.getNote(midiNote, microDist);
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
