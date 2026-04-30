import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms';
import Database from '@tauri-apps/plugin-sql';
import { ask, message } from '@tauri-apps/plugin-dialog';
import id from '@angular/common/locales/extra/id';
@Component({
  selector: 'app-add-line',
  imports: [CommonModule,FormsModule],
  templateUrl: './add-line.html',
  styleUrl: './add-line.css',
})
export class AddLine implements OnInit {
  selectedlineno :String =""
  linename:String="";
  lineno:String="";
  searchlines:any[]=[];
  days = [
    { name: 'Mon', label: 'M', selected: false },
    { name: 'Tue', label: 'T', selected: false },
    { name: 'Wed', label: 'W', selected: false },
    { name: 'Thu', label: 'T', selected: false },
    { name: 'Fri', label: 'F', selected: false },
    { name: 'Sat', label: 'S', selected: false },
    { name: 'Sun', label: 'S', selected: false },
  ];

  toggleDay(day: any) {
    day.selected = !day.selected;
  }

  async saveLine(){
      const db = await Database.load("sqlite:assignments.db");
      let dval:string=""
      for (let day of this.days) {
        dval += day.selected ? "T" : "F";
      }
      await db.execute(
        "INSERT INTO lines (lineno, linename,days) VALUES ($1, $2, $3)",
        [this.lineno, this.linename, dval]
      );

      await message('Line saved successfully to the database!', { 
        title: 'Success', 
        kind: 'info' 
      });
  }

  async searchLine(){
    const db = await Database.load("sqlite:assignments.db");
    this.searchlines = await db.select(
          "SELECT * FROM lines WHERE lineno LIKE $1 OR linename LIKE $1 OR CAST(id AS TEXT) = $2",
          [`%${this.selectedlineno}%`, this.selectedlineno]
        );
    this.searchlines.forEach(line => {
      line.days = line.days.split('').map((d: string) => d === 'T');
    });
  }

  async deleteLine(id: number, name: string) {
    const confirmed = await ask(`Are you sure you want to delete line "${name}" and all its assignments?`, { title: 'Confirm Deletion', kind: 'warning' });
    if (!confirmed) {
      return;
    }
    
    try {
      const db = await Database.load("sqlite:assignments.db");
      await db.execute("DELETE FROM lines WHERE id = $1", [id]);
      await db.execute("DELETE FROM assignments WHERE lineno = $1", [id]);
      // await db.execute("DELETE FROM assignments WHERE line_id = $1", [id]);
      this.searchlines = this.searchlines.filter(u => u.id !== id);
    }
    catch (error) {
      await message(`Delete failed: ${error}`, { title: 'Database Error', kind: 'error' });
    }
  }

  async ngOnInit() {
      const db = await Database.load("sqlite:assignments.db");
      await db.execute("CREATE TABLE IF NOT EXISTS lines (id INTEGER PRIMARY KEY, lineno TEXT UNIQUE, linename TEXT, days TEXT)");
    }
}
