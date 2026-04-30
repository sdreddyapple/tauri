import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import Database from '@tauri-apps/plugin-sql';
import { message,ask } from '@tauri-apps/plugin-dialog';
import { from } from 'rxjs';

@Component({
  selector: 'app-assignment',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './assignment.html',
  styleUrl: './assignment.css',
})
export class Assignment implements OnInit {
  // Form Variables
  selectedlineno: string = "";
  selecteduserno: string = "";
  selectedusernosearch:string="";
  selectedUser="";
  fromdate: string = "";
  todate: string = "";
  tp: string = "";
  modifyfromdate:string=""

  // Dropdown Data
  userdrops: any[] = [];
  linedrops: any[] = [];
  assignmentusers:any[]=[];
  
  // List to show saved assignments
  assignments: any[] = [];

  async ngOnInit() {
    await this.setupDatabase();
    await this.loadDropdowns();
    await this.refreshList();
  }

  async setupDatabase() {
    const db = await Database.load("sqlite:assignments.db");
    // Ensure the assignments table exists
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lineno TEXT,
        userno TEXT,
        fromDate TEXT,
        toDate TEXT,
        tp TEXT
      )
    `);
  }

  async loadDropdowns() {
    try {
      const db = await Database.load("sqlite:assignments.db");
      // Load users and lines for the dropdowns
      this.userdrops = await db.select("SELECT username, tag FROM users");
      this.userdrops.push({ username: "All", tag: "All" });
      this.linedrops = await db.select("SELECT linename, lineno FROM lines");
    } catch (error) {
      console.error("Failed to load dropdowns", error);
    }
  }

  async saveAssignment() {
    if (!this.selectedlineno || !this.selecteduserno) {
      await message("Please select both a User and a Line", { title: "Validation", kind: "warning" });
      return;
    }

    try {
      const db = await Database.load("sqlite:assignments.db");
      await db.execute(
        "INSERT INTO assignments (lineno, userno, fromDate, toDate, tp) VALUES ($1, $2, $3, $4, $5)",
        [this.selectedlineno, this.selecteduserno, this.fromdate, this.todate, this.tp]
      );
      
      await message("Assignment Saved!", { title: "Success", kind: "info" });
      this.refreshList();
    } catch (error) {
      await message(`Save failed: ${error}`, { title: 'Database Error', kind: 'error' });
    }
  }

  async refreshList() {
    const db = await Database.load("sqlite:assignments.db");
    this.assignments = await db.select("SELECT * FROM assignments where userno=$1", [this.selectedusernosearch]);
  }

  async getAssignments() {
    try{
      const db = await Database.load("sqlite:assignments.db");
      console.log(this.selectedusernosearch);
      debugger;
      this.assignmentusers=[];
       let allusers:any[]=[];
      if(this.selectedusernosearch.trim()=="" || this.selectedusernosearch.trim()=="All"){
        allusers = await db.select("SELECT * FROM users");
      }
      else{
        allusers.push({ tag: this.selectedusernosearch });
      }
      
      let curruser:userassignment;
      for(let user of allusers){
          curruser = new userassignment();
          curruser.userno=user.tag;
          this.assignments = await db.select("SELECT * FROM assignments where userno=$1", [user.tag]);
          for(const assignment of this.assignments){
            if(assignment.toDate==null || assignment.toDate==""){
              assignment.tp=this.getWeeksBetween(assignment.fromDate, new Date().toString())
              assignment.toDate="Today"
            }
            else{
                assignment.tp=this.getWeeksBetween(assignment.fromDate, assignment.toDate) 
            }
            curruser.assignments.push(assignment);
          }
          this.assignmentusers.push(curruser);
      }
    }
    catch (error) {
      // What to do if an error happens
      console.error("Oops! Something went wrong:", error);
    } finally {
      // Always runs (e.g., closing a database connection)
      console.log("Cleanup complete.");
    }

    
  }


  async deleteAssignment(userno:string,lineno:string){
     const confirmed = await ask(
      `Are you sure you want to delete assignment for user ${userno} on line ${lineno}? This cannot be undone.`, 
      { title: 'Confirm Deletion', kind: 'warning' }
    );
    if(!confirmed) {
      return; 
    }
    try {
      const db = await Database.load("sqlite:assignments.db");
      await db.execute("DELETE FROM assignments WHERE userno = $1 and lineno=$2", [userno, lineno]);
      this.assignments = this.assignments.filter(a => a.userno !== userno || a.lineno !== lineno);
      await message('Assignment deleted successfully', { title: 'Success', kind: 'info' });
    } catch (error) {
      await message(`Delete failed: ${error}`, { title: 'Database Error', kind: 'error' });
    }

  }

  modifycalculations(){
    debugger;
    for(const assignment of this.assignments){
      if(assignment.toDate==null || assignment.toDate=="" || assignment.toDate=="Today"){
        assignment.tp=this.getWeeksBetween(this.modifyfromdate, new Date().toString())
        assignment.toDate="Today"
      }
      else{
          assignment.tp=this.getWeeksBetween(this.modifyfromdate, assignment.toDate)
      }
    }
  }

  getWeeksBetween(fromDt: string, toDt: string): number {
    if (!fromDt || !toDt) return 0;
    const start = new Date(fromDt as string);
    const end = new Date(toDt as string);
    const diffInMs = end.getTime() - start.getTime();
    if (diffInMs < 0) return 0;
    const msInWeek = 1000 * 60 * 60 * 24 * 7;
    return Math.floor(diffInMs / msInWeek);
}
  onUserChange(){

  }

  onLineChange(){

  }

  resetdate(flow:string){
    if(flow=="from"){
      this.fromdate="";
    }
    else if(flow=="to"){
      this.todate="";
    }
  }
}


class userassignment{
  userno:string="";
  assignments:any[]=[];
}