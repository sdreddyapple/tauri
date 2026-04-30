import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import Database from '@tauri-apps/plugin-sql';
import { message,ask } from '@tauri-apps/plugin-dialog';
import { from } from 'rxjs';
import { formatDate } from '@angular/common';


@Component({
  selector: 'app-attendance',
  imports: [FormsModule, CommonModule],
  templateUrl: './attendance.html',
  styleUrl: './attendance.css',
})
export class Attendance implements OnInit {

    selectedlineno: string = "";
    selectedlinename: string = "";
    selectedlinedays: string = "";
    selectedusername: string = "";
    selecteduserno: string = "";
    currscreen:string="init";
    entryDate:string="";
    viewDate:string="";
    linedrops: any[] = [];
    userdrops: any[] = [];
    attendances:any[]=[];
    isSaving:boolean=false;
    existingEntries:any[]=[];
    absentDays:any[]=[];
    presentDays:any[]=[];
    resetdate(flow:string){
      if(flow=="entry"){
        this.entryDate="";
      }
    }

    async processInputs() {
      this.currscreen="entry";
      const db = await Database.load("sqlite:assignments.db");
      const alldates = this.getDateRange(this.entryDate);
      this.attendances = [];
      for (let date of alldates) {
        const existingEntry: any[] = await db.select(
          "SELECT status FROM attendance WHERE userno = $1 AND date = $2",
          [this.selecteduserno, date]
        );
        const dateObj = new Date(date);
        const dayOfWeek = (dateObj.getDay() + 6) % 7;
        const finalStatus = existingEntry.length > 0 ? existingEntry[0].status : 'No Entry';
        let attendanceRecord = {
          userno: this.selecteduserno,
          lineno: this.selectedlineno,
          date: date,
          status: finalStatus,
          enabled: this.selectedlinedays.charAt(dayOfWeek) === 'T',
          day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][dayOfWeek],
          existingentry: existingEntry.length > 0
        };

        this.attendances.push(attendanceRecord);
      }
    }

    async loadDropdowns() {
        try {
          const db = await Database.load("sqlite:assignments.db");
          // Load users and lines for the dropdowns
          this.userdrops = await db.select("SELECT username, tag FROM users");
          
        } catch (error) {
          console.error("Failed to load dropdowns", error);
        }
    }

    async onUserChange(){
      const db = await Database.load("sqlite:assignments.db");
      const selectedUser = this.userdrops.find(user => user.tag === this.selecteduserno);
      this.linedrops = await db.select("SELECT linename, lineno, days FROM lines WHERE lineno IN (SELECT lineno FROM assignments WHERE userno = $1)", [this.selecteduserno]);
      if (selectedUser) {
        this.selectedusername = selectedUser.username;
      }
    }

    onLineChange(){
      const selectedLine = this.linedrops.find(line => line.lineno === this.selectedlineno);
      if (selectedLine) {
        this.selectedlinename = selectedLine.linename;
        this.selectedlinedays = selectedLine.days;
      }
    }

    async save() {
      let savedCount = 0;
      let errorCount = 0;
      this.isSaving = true; 
      debugger;
      try {
          const db = await Database.load("sqlite:assignments.db");
          for (let attendance of this.attendances) {
              if (attendance.enabled && attendance.status !== 'No Entry') {
                  try {
                      if(attendance.existingentry){
                        await this.updateAttendance(attendance)
                      }
                      else{
                        await this.saveAttendance(attendance);
                      }
                      savedCount++;
                  } catch (e) {
                      console.error(`Failed to save date ${attendance.date}`, e);
                      errorCount++;
                  }
              }
          }
          await message(`Successfully saved ${savedCount} records. ${errorCount > 0 ? errorCount + ' failed.' : ''}`, { 
              title: 'Attendance Sync', 
              kind: errorCount > 0 ? 'warning' : 'info' 
          });

      } catch (err) {
          console.error("Database connection error", err);
      } finally {
          this.isSaving = false;
      }
}

   async saveAttendance(attendance: any): Promise<string | null> {
    try {
        const db = await Database.load("sqlite:assignments.db");
        await db.execute(
            "INSERT INTO attendance (userno, lineno, date, status) VALUES ($1, $2, $3, $4)",
            [attendance.userno, attendance.lineno, attendance.date, attendance.status]
        );
        return null; // Return null if there's no error
    } catch (error: any) {
        debugger;
        console.error("Save Error:", error);
        return `Failed to save ${attendance.date}: ${error.message || error}`;
    }
}

async updateAttendance(attendance: any): Promise<string | null> {
    try {
        const db = await Database.load("sqlite:assignments.db");
        // Use .execute for UPDATE, not .select
        await db.execute(
            "UPDATE attendance SET status = $1 WHERE userno = $2 AND lineno = $3 AND date = $4", 
            [attendance.status, attendance.userno, attendance.lineno, attendance.date]
        );
        return null;
    } catch (error: any) {
        debugger;
        console.error("Update Error:", error);
        return `Failed to update ${attendance.date}: ${error.message || error}`;
    }
}

    

  async ngOnInit() {
    await this.setupDatabase();
    await this.loadDropdowns();
  }

  async setupDatabase() {
      const db = await Database.load("sqlite:assignments.db");
      // Ensure the attendance table exists
      await db.execute(`
       CREATE TABLE IF NOT EXISTS attendance (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userno TEXT NOT NULL,
          lineno TEXT NOT NULL,
          date TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('PRESENT', 'ABSENT', 'ON LEAVE', 'LATE', 'NO ENTRY'))
      );
      `);
    }

    showData(){
      this.currscreen="view";
    }

    getDateRange(inputDate:string) {
      const targetDate = new Date(inputDate);
      const results = [];
        for (let i = -5; i <= 5; i++) {
            let current = new Date(targetDate);
            current.setDate(targetDate.getDate() + i);
            results.push(current.toISOString().split('T')[0]);
        }
      return results;
    }

    markAttendance(attendance: attendance, status: string) {
     attendance.status=status
    }

    async fetchvalues(){
      const db = await Database.load("sqlite:assignments.db");
      this.existingEntries= await db.select(
          "SELECT status, count(*) AS total FROM attendance WHERE userno = $1 AND lineno=$2 AND date > $3 group by status",
          [this.selecteduserno, this.selectedlineno, this.viewDate]
        );

      this.absentDays= await db.select(
          "SELECT date FROM attendance WHERE userno = $1 AND lineno=$2 AND date > $3 AND status='ABSENT' group by date",
          [this.selecteduserno, this.selectedlineno, this.viewDate]
        );
      this.presentDays= await db.select(
          "SELECT date FROM attendance WHERE userno = $1 AND lineno=$2 AND date > $3 AND status='PRESENT' group by date",
          [this.selecteduserno, this.selectedlineno, this.viewDate]
        );  
    }

    formatForDisplay(date: Date | string): string {
      if(date instanceof Date){
        return formatDate(date, 'dd-MMM-yyyy', 'en-US');
      } else {
        return date.split('-').reverse().join('-'); // Convert YYYY-MM-DD to DD-MM-YYYY
      }
    }
}




class attendance{
  userno:string="";
  day:string="";
  lineno:string="";
  date:string="";
  status:string="";
  enabled:boolean=true;
  existingentry:boolean=false;
}
