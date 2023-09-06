import { MusicScale, MusicNote } from "./Scales/MusicScale.js"

export class SynthInstrument {
    #name = "(no name)";
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

	// 0 <= volume <= 1.0
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

    toEffectiveVolume(velocity) {
        let vol = this.Volume * Math.log2(velocity+1.0);
        vol = Math.max(0, vol);
        vol = Math.min(1, vol);
		return vol;
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
        /*
        this.#slotsFree.push(this.#slotsActive.values());
        this.#slotsActive.clear();
        */
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

