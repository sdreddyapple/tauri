import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import Database from '@tauri-apps/plugin-sql';
import { ask, message } from '@tauri-apps/plugin-dialog';
@Component({
  selector: 'app-add-user',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './add-user.html',
  styleUrl: './add-user.css',
})
export class AddUser implements OnInit {
  username: string = "";
  tag: string = "";
  searchuserid: string = "";
  users: any[] = [];
  searchusers:any[] = [];

  async saveUser(){
    console.log("SAVE STARTED")
    if (!this.username) {
      await message('Please enter a username', { title: 'Validation', kind: 'warning' });
      return;
    }

    try {
      const db = await Database.load("sqlite:assignments.db");
      await db.execute(
        "INSERT INTO users (username, tag) VALUES ($1, $2)",
        [this.username, this.tag]
      );

      // SUCCESS POPUP
      await message('User saved successfully to the database!', { 
        title: 'Success', 
        kind: 'info' 
      });

      this.username = "";
      this.tag = "";

    } catch (error) {
      // FAIL POPUP
      await message(`Save failed: ${error}`, { 
        title: 'Database Error', 
        kind: 'error' 
      });
    }
  }
  

  async searchUser(){
    try {
      this.searchusers = [];
      if (!this.searchuserid.trim()) {
        await message('Please enter username, tag, or id', { title: 'Validation', kind: 'warning' });
        return;
      }

      const db = await Database.load("sqlite:assignments.db");
      debugger;
      this.searchusers = await db.select(
        "SELECT * FROM users WHERE username LIKE $1 OR tag LIKE $1 OR CAST(id AS TEXT) = $2",
        [`%${this.searchuserid}%`, this.searchuserid]
      );

      for (const user of this.searchusers) {
        console.log("Fetching lines for:", user.username);
        const curruserlines = await db.select(
          "SELECT * FROM assignments WHERE userno = $1", 
          [user.tag]
        );
        user.lines = curruserlines; 
      }
      console.log("SD")
      
    } catch (error) {
      await message(`Search failed: ${error}`, { title: 'Database Error', kind: 'error' });
    }
  }


  async deleteUser(id: number, username: string) {
    const confirmed = await ask(
      `Are you sure you want to delete user "${username}"? This cannot be undone.`, 
      { title: 'Confirm Deletion', kind: 'warning' }
    );
    if(!confirmed) {
      return; 
    }
    try {
      const db = await Database.load("sqlite:assignments.db");
      await db.execute("DELETE FROM users WHERE id = $1", [id]);
      this.searchusers = this.searchusers.filter(u => u.id !== id);
      await message('User deleted successfully', { title: 'Success', kind: 'info' });
    } catch (error) {
      await message(`Delete failed: ${error}`, { title: 'Database Error', kind: 'error' });
    }
  }

  async ngOnInit() {
    const db = await Database.load("sqlite:assignments.db");
    await db.execute("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, tag TEXT UNIQUE)");
  }

  // searchuser=
  //   {
  //     userno: "25",
  //     username: "Satya",
  //     fromDate: "2025-01-01",
  //     toDate: "2025-03-01",
  //     tp:"1003"
  //   }
  // ;
  activelines=[
    {
      lineno: "1001",
      fromDate: "2025-01-01",
      toDate: "2025-03-01",
      tp:"1001"
    }
  ]
}