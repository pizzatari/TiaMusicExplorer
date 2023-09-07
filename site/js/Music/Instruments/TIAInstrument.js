import { Music } from "../Music.js"
import { MusicScale, MusicNote } from "../Scales/MusicScale.js"
import { TIAScale, TIANote } from "../Scales/TIAScale.js"
import { SynthInstrument } from "../SynthInstrument.js"

const TIA_AUDC0 = 0x15;
const TIA_AUDC1 = 0x16;

const TIA_AUDF0 = 0x17;
const TIA_AUDF1 = 0x18;

const TIA_AUDV0 = 0x19;
const TIA_AUDV1 = 0x1A;

const TIA_AUDC = [ TIA_AUDC0, TIA_AUDC1 ];
const TIA_AUDF = [ TIA_AUDF0, TIA_AUDF1 ];
const TIA_AUDV = [ TIA_AUDV0, TIA_AUDV1 ];

export class TIAInstrument extends SynthInstrument {

    constructor(noteList) {
        super("TIA", noteList);
        super.Polyphony = 2;
        super.PolyphonyLocked = true;
		super.Slots = [ 0, 1 ];
    }

	// play midi note (plays nearest note by frequency)
    noteOn(midiNote, microDist = 0, velocity = 1.0) {
        let note = this.getNote(midiNote, microDist);

        if (note !== null)  {
			let id = this.Key(midiNote, microDist);
			let slot = this.getSlot(id);

			if (slot !== null) {
        		// logarithmic curve
                let effectiveVolume = super.toEffectiveVolume(velocity);

            	Javatari.room.console.tia.write(TIA_AUDC[slot], note.AUDC);
            	Javatari.room.console.tia.write(TIA_AUDF[slot], note.AUDF);
            	Javatari.room.console.tia.write(TIA_AUDV[slot], Math.round(effectiveVolume * 15));
                return note;
			}
        }
        return null;
    }

    noteOff(midiNote, microDist = 0) {
        let note = this.getNote(midiNote, microDist);

        if (note !== null)  {
			let id = this.Key(midiNote, microDist);
			let slot = this.getActiveSlot(id);

			if (slot !== null) {
            	Javatari.room.console.tia.write(TIA_AUDV[slot], 0);
                this.freeSlot(id);
                return note;
			}
        }
        return null;
	}

    allNotesOff() {
		for(let i=0; i <= 1; i++) {
    		Javatari.room.console.tia.write(TIA_AUDV[i], 0);
    		Javatari.room.console.tia.write(TIA_AUDC[i], 0);
    		Javatari.room.console.tia.write(TIA_AUDF[i], 0);
		}
        this.freeAllSlots();
    }
    
    sustainOn() {
    }

    sustainOff() {
    }

	// play a letter key (A, C#, Db...)
	keyOn(keyNote, octave, microNum, velocity = 1.0) { }
	keyOff(keyNote, octave, microNum) { }

	// play for a limited duration (seconds)
	playNote(midiNote, velocity = 1.0, duration = 1.0) { }
	playKey(keyNote, octave, microNum, velocity = 1.0, duration = 1.0) { }

    // play TIA tone
	toneOn(control, pitch, volume) { }
	toneOff(control, pitch, volume) { }
	playTone(control, pitch, volume, duration = 1.0) { }
}
