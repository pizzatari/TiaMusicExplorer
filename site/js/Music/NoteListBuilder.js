import { Music } from "./Music.js";
import { MusicScale, MusicNote, NoteList } from "./Scales/MusicScale.js";
import { TIAScale, TIANote, ModeMap, Divisors } from "./Scales/TIAScale.js";

export class NotePair {
    #first = null;
    #second = null;
    #cents = 0.0;

    constructor(firstNote, secondNote) {
        this.#first = firstNote;
        this.#second = secondNote;
        this.#cents = Music.CentsBetween(firstNote.Frequency, secondNote.Frequency);
    }

    get First() { return this.#first }
    get Second() { return this.#second }
    get Cents() { return this.#cents }
}

// maps a key note to a group of similar notes
export class NoteGroup {
    #keyNote = null;
    #pairList = [];

    constructor(keyNote) {
        this.#keyNote = keyNote;
    }

    get KeyNote() { return this.#keyNote }
    //get NoteList() { return this.#noteList }
    get BestNote() {
        if (this.#pairList.length > 0)
            return this.#pairList[0].Second;
        return null;
    }
    get BestNotePair() {
        if (this.#pairList.length > 0)
            return this.#pairList[0];
        return null;
    }
    get ListLength() {
        return this.#pairList.length;
    }

    addNote(note) {
        this.#pairList.push(new NotePair(this.KeyNote, note));
        this.sort();
    }

    addNoteList(noteList) {
        noteList.forEach((note) => {
            this.#pairList.push(new NotePair(this.KeyNote, note));
        });
        this.sort();
    }

    sort() {
        this.#pairList.sort((a,b) => {
            let c = a.Second.Frequency - b.Second.Frequency;
            if (c != 0) return c;
            return Math.abs(a.Cents) - Math.abs(b.Cents);
        });
    }
}

/*
export class NoteList extends Array {
    #name = '(none)';

    #noteBounds = {
        firstMicroId: Number.MAX_VALUE, lastMicroId: -Number.MAX_VALUE,
        firstMidiNum: Number.MAX_VALUE, lastMidiNum: -Number.MAX_VALUE,
        firstKeyNum:  Number.MAX_VALUE, lastKeyNum:  -Number.MAX_VALUE,
    };

    constructor(name) {
        this.#name = name;
    }

    set Name(val) { this.#name = val }
    get Name() { return this.#name }

    get Bounds() { return this.#noteBounds }

    pushNote(note) {
        this.push(note);

        if (note.MicroId < this.#noteBounds.firstMicroId)
            this.#noteBounds.firstMicroId = note.MicroId;

        if (note.MicroId > this.#noteBounds.lastMicroId)
            this.#noteBounds.lastMicroId = note.MicroId;

        if (note.MidiNum < this.#noteBounds.firstMidiNum)
            this.#noteBounds.firstMidiNum = note.MidiNum;

        if (note.MidiNum > this.#noteBounds.lastMidiNum)
            this.#noteBounds.lastMidiNum = note.MidiNum;

        if (note.KeyNum < this.#noteBounds.firstKeyNum)
            this.#noteBounds.firstKeyNum = note.KeyNum;

        if (note.KeyNum > this.#noteBounds.lastKeyNum)
            this.#noteBounds.lastKeyNum = note.KeyNum;
    }

    pushNotes(ary) {
        for (let i=0; i < ary.length; i++)
            this.pushNote(ary[i]);
    }

    clone() {
        let list = new NoteList(this.Name);

        for (let i=0; i < this.length; i++)
            list.pushNote(this[i].clone());

        return list;
    }
}
*/

// map = MicroId -> NoteGroup
export class NoteTable extends Map {
    #pianoNoteList = null;
    #tiaNoteList = null;

    #matchedNotes = [];
    #unmatchedNotes = [];

    constructor(pianoNoteList, tiaNoteList) {
        super();
        this.#pianoNoteList = pianoNoteList;
        this.#tiaNoteList = tiaNoteList;

        // setup Map object
        for (let note of pianoNoteList)
            this.set(note.MicroId, new NoteGroup(note));

        // merge in tia notes
        for (let n of tiaNoteList) {
            let note = n.clone();
            let group = this.get(note.MicroId);
            if (group !== undefined) {
                group.addNote(note);
                this.#matchedNotes.push(note);
                //this.#analyzer.addPair(group);
            } else {
                this.#unmatchedNotes.push(note);
            }
        }
    }

    get PivotNoteList() { return this.#pianoNoteList }
    get NoteList() { return this.#tiaNoteList }

    get PivotBounds() { return this.#pianoNoteList.Bounds }
    get NoteBounds() { return this.#tiaNoteList.Bounds }


    /*
    #joinList(noteList) {
        if (this.#tiaNoteList == null)
            this.#tiaNoteList = noteList;

        this.#tiaNoteList.pushNotes(noteList);

        for (let n of noteList) {
            let note = n.clone(n);
            let group = this.get(note.MicroId);
            if (group !== undefined) {
                group.addNote(note);
                this.#matchedNotes.push(note);
                //this.#analyzer.addPair(group);
            } else {
                this.#unmatchedNotes.push(note);
            }
        }
    }
    */

    getFlattenedTable() {
		let ary = [];

        for (let [key, group] of this) {
			let keyNote = group.KeyNote;
			let pair = group.BestNotePair;
            let note = group.BestNote;

            // save a record of paired black notes
            if (ary.length > 0 && keyNote.IsBlack && note != null)
                ary[ary.length-1].TIASharpNote = note;

            let row = {
				MicroId: keyNote.MicroId,
				KeyNum: keyNote.KeyNum,
				MidiNum: keyNote.MidiNum,
				MicroDist: keyNote.MicroDist,
				Octave: keyNote.Octave,

				Key: keyNote.Key,
				KeyUp: keyNote.KeyUp,
				KeyDown: keyNote.KeyDown,

                IsWhite: keyNote.IsWhite,
                IsBlack: keyNote.IsBlack,
                Label: keyNote.Label,

            	Frequency: keyNote.Frequency,
            	FrequencyRounded: keyNote.getFrequencyRounded(),

            	TIAFrequency: note != null ? note.Frequency : '',
            	TIAFrequencyRounded: note != null ? note.getFrequencyRounded() : '',
				AUDC: note != null ? note.AUDC : '',
				AUDF: note != null ? note.AUDF : '',
				Cents: pair != null ? pair.Cents : '',
				CentsRounded: pair != null ? pair.Cents : '',
				//CentsRounded: pair != null ? pair.getCentsRounded() : '',
				TIALabel: note != null ? note.AUDC + '/' + note.AUDF : '',


                KeyNote: keyNote,
                SharpKeyNote: keyNote.getSharpNote(),

                TIANote: note,
                TIASharpNote: null
			};
            ary.push(row);

        }

        console.log("NoteListBuilder: Flattened table");
        //console.log(ary);

        return ary;
    }
}

export class NoteListBuilder {
    static tiaCache = new Map();

    static getPianoNoteList(music, bounds=null) {
        console.log("getPianoNotes:");

        let scale = new MusicScale(music, bounds);
        let noteList = scale.getNoteList();
        //console.log(noteList);

        return noteList;
    }

    static getTIANoteList(music, args) {
        console.log("getTIANotes:");

        let noteList = new NoteList('TIA');

        for (let i=0; i < args.audc.length; i++) {
            let scale = new TIAScale(music, args.mode, args.audc[i]);
            noteList.pushNotes(scale.getNoteList());
        }

        //console.log(noteList);

        return noteList;
    }

    /*
    static getTIABounds(music, args) {
		let videoMode = ModeMap[args.mode];
        let minFreq = Number.MAX_VALUE;
        let maxFreq = -Number.MAX_VALUE;

        for (let i=0; i < args.audc.length; i++) {
            let audc = args.audc[i];
            let min = videoMode.AudioFrequency / Divisors[audc] / 32;
            let max = videoMode.AudioFrequency / Divisors[audc] / 1;

            if (min , minFreq)
                minFreq = min;
            if (max > maxFreq)
                maxFreq = max;
        }

        return {
            firstMicroId: music.FrequencyToMicroId(minFreq), lastMicroId: music.FrequencyToMicroId(maxFreq),
            firstMidiNum: music.FrequencyToMidiNum(minFreq), lastMidiNum: music.FrequencyToMidiNum(maxFreq),
            firstKeyNum:  music.FrequencyToKeyNum(minFreq),  lastKeyNum:  music.FrequencyToKeyNum(maxFreq),
        };
    }
    */

    static getNoteTable(music, args) {
        let pianoNotes = this.getPianoNoteList(music);
        let tiaNotes = this.getTIANoteList(music, args);
        return new NoteTable(pianoNotes, tiaNotes);
    }
}
