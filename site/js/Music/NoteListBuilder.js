import { Music } from "./Music.js";
import { MusicScale, MusicNote } from "./Scales/MusicScale.js";
import { TIAScale, TIANote, ModeMap, Divisors } from "./Scales/TIAScale.js";

// maps a key note to a group of similar notes
export class NoteGroup {
    #keyNote = null;
    #noteList = [];

    constructor(keyNote) {
        this.#keyNote = keyNote;
    }

    get KeyNote() { return this.#keyNote }
    get NoteList() { return this.#noteList }
    get BestNote() {
        if (this.#noteList.length > 0)
            return this.#noteList[0];
        return null;
    }
    get ListLength() {
        return this.#noteList.length;
    }

    addNote(note) {
        this.#noteList.push(note);
        this.sort();
    }

    addNoteList(noteList) {
        this.#noteList = this.#noteList.concat(noteList);
        this.sort();
    }

    sort() {
        this.#noteList.sort((a,b) => {
            let c = a.Frequency - b.Frequency;
            if (c != 0)
                return c;
            return Math.abs(a.Cents) - Math.abs(b.Cents);
        });
    }
}

export class NoteList extends Array {
    #noteBounds = {
        firstMicroId: Number.MAX_VALUE, lastMicroId: -Number.MAX_VALUE,
        firstMidiNum: Number.MAX_VALUE, lastMidiNum: -Number.MAX_VALUE,
        firstKeyNum:  Number.MAX_VALUE, lastKeyNum:  -Number.MAX_VALUE,
    };

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
        let list = new NoteList();

        for (let i=0; i < this.length; i++)
            list.pushNote(this[i].clone());

        return list;
    }
}

// map = MicroId -> NoteGroup
export class NoteTable extends Map {
    #pivotNoteList = new NoteList();
    #noteList = new NoteList();

    #matchedNotes = [];
    #unmatchedNotes = [];

    constructor(pivotNoteAry, noteAry) {
        super();

        this.#pivotNoteList.pushNotes(pivotNoteAry);

        for (let note of pivotNoteAry)
            this.set(note.MicroId, new NoteGroup(note));

        this.joinList(noteAry);
    }

    get PivotNoteList() { return this.#pivotNoteList }
    get NoteList() { return this.#noteList }

    get PivotBounds() { return this.#pivotNoteList.Bounds }
    get NoteBounds() { return this.#noteList.Bounds }

    joinList(noteAry) {
        this.#noteList.pushNotes(noteAry);

        for (let n of noteAry) {
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

    getFlattenedTable() {
		let ary = [];

        for (let [key, group] of this) {
			let keyNote = group.KeyNote;
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
				Cents: note != null ? note.Cents : '',
				CentsRounded: note != null ? note.getCentsRounded() : '',
				TIALabel: note != null ? note.AUDC + '/' + note.AUDF : '',


                KeyNote: keyNote,
                SharpKeyNote: keyNote.getSharpNote(),

                TIANote: note,
                TIASharpNote: null
			};
            ary.push(row);
        }

        return ary;
    }
}

export class NoteListBuilder {
    static tiaCache = new Map();

    static getPianoNotes(music, bounds=null) {
        let noteList = new NoteList();
        let scale = new MusicScale(music, bounds);

        noteList.pushNotes(scale.getNoteList());

        return noteList;
    }

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

    static getTIANotes(music, args) {
        let noteList = new NoteList();

        for (let i=0; i < args.audc.length; i++) {
            let scale = new TIAScale(music, args.mode, args.audc[i]);
            noteList.pushNotes(scale.getNoteList());
        }

        return noteList;
    }

    static getNoteTable(pivotNoteList, noteList) {
        return new NoteTable(pivotNoteList, noteList);
    }
}
