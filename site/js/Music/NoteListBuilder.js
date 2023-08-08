import { Music } from "./Music.js";
import { MusicScale, MusicNote } from "./Scales/MusicScale.js";
import { TIAScale, TIANote } from "./Scales/TIAScale.js";

// binds a note to a list of similar notes
export class NoteGroup {
    #note = null;
    #noteList = [];

    constructor(note) {
        this.#note = note;
    }

    get NoteList() { return this.#noteList }

    getBestNote(note) {
        if (this.#noteList.length > 0)
            return this.#noteList[0];
        return null;
    }

    addNote(note) {
        this.#noteList.push(note);
        // TODO: maintain sorted order
    }

    addNoteList(noteList) {
        this.#noteList = this.#noteList.concat(noteList);
        // TODO: maintain sorted order
    }
}

// map = MicroId -> NoteGroup
export class NoteTable extends Map {
    #pivotNoteList = null;
    #noteLists = [];
    #matchedNotes = [];
    #unmatchedNotes = [];
    #pivotBounds = { firstMicroId:-1, lastMicroId:0 };
    #noteBounds = { firstMicroId:-1, lastMicroId:0 };

    constructor(pivotNoteList, noteList) {
        super();
        this.#pivotNoteList = pivotNoteList;

        for (let note of pivotNoteList)
            this.set(note.MicroId, new NoteGroup(note));

        this.#noteLists.push(noteList);
        this.joinList(noteList);
    }

    get PivotNoteList() { return this.#pivotNoteList }
    get PivotBounds() { return this.#pivotBounds }
    get NoteBounds() { return this.#noteBounds }

    joinList(noteList) {
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

            if (this.#noteBounds.firstMicroId == -1 || note.MicroId < this.#noteBounds.firstMicroId)
                this.#noteBounds.firstMicroId = note.MicroId;

            if (note.MicroId > this.#noteBounds.lastMicroId)
                this.#noteBounds.lastMicroId = note.MicroId;
        }
    }
}

export class NoteListBuilder {
    static getPianoNotes(music) {
        let scale = new MusicScale(music);
        return scale.getNoteList();
    }

    static getTIANotes(music) {
        let scale = new TIAScale(music);
        return scale.getNoteList();
    }

    static getNoteTable(pivotNoteList, noteList) {
        return new NoteTable(pivotNoteList, noteList);
    }
}
