import { Component, OnInit } from '@angular/core';
// import { save } from '@tauri-apps/api/dialog';
import { readFile, writeFile,copyFile, BaseDirectory,remove } from '@tauri-apps/plugin-fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import { save,open } from '@tauri-apps/plugin-dialog';
import Database from '@tauri-apps/plugin-sql';
import { FormsModule } from '@angular/forms';
import { random } from 'gsap';
@Component({
  selector: 'app-data-management',
  imports: [FormsModule],
  templateUrl: './data-management.html',
  styleUrl: './data-management.css',
})
export class DataManagement implements OnInit {
  existingTables: string[] = [];
  showTableSelector=false;
  selectedTable="";
  delvalue="";
  random2Digit = Math.floor(Math.random() * 90) + 10;

  randomGenerate(){
    this.random2Digit = Math.floor(Math.random() * 90) + 10;
  }
  async ngOnInit(): Promise<void> { 
    this.existingTables=await this.getTableNames();
  }

  async export(){
    const targetPath = await save({
      title: 'Export Attendance Database',
      defaultPath: 'attendance_backup.db',
      filters: [{
        name: 'SQLite Database',
        extensions: ['db', 'sqlite']
      }]
    });
    const appDataDirPath = await appDataDir();
    const source = await join(appDataDirPath, 'assignments.db');
    if (targetPath) {
      await copyFile(source, targetPath);
      console.log('Database exported to:', targetPath);
      // Optional: Show a success toast or notification
    }
  }



  async importDB() {
  try {
    // 1. Pick the file
    const selectedPath = await open({
      filters: [{ name: 'SQLite', extensions: ['db'] }]
    });
    if (!selectedPath) return;

    // 2. Read the new file into memory
    const contents = await readFile(selectedPath as string);

    // 3. Write it directly to the AppData folder
    // Using writeBinaryFile often bypasses the "overwrite" locks that copyFile hits
    await writeFile('assignments.db', contents, { 
      baseDir: BaseDirectory.AppData 
    });

    console.log("Write successful! Timestamp should update now.");
    
    alert("Database Updated! Reloading...");
    // window.location.reload();
  } catch (err) {
    console.error("Write failed:", err);
  }
}

async getTableNames(): Promise<string[]> {
  const db = await Database.load("sqlite:assignments.db");
  // This query skips internal sqlite tables
  const result = await db.select<any[]>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
  );
  return result.map(row => row.name);
}

  showdeleteList(){
    this.showTableSelector=true;
  }

  deleteTable(){
    if(this.delvalue===this.selectedTable+"_"+this.random2Digit){
      this.deleteTableFromDB(this.selectedTable)
      // remove(this.selectedTable, { baseDir: BaseDirectory.AppData })
      //   .then(() => {
      //     console.log('File deleted successfully');
      //     alert('Table deleted successfully');
      //     this.showTableSelector=false;
      //     this.existingTables= this.existingTables.filter(table => table !== this.selectedTable);
      //   })
      //   .catch((error) => {
      //     console.error('Error deleting file:', error);
      //     alert('Failed to delete table: ' + error);
      //   });
    } else {
      alert("Please enter the correct value to confirm deletion.");
    }
  }

  async deleteTableFromDB(tableName:string){
    try {
            const db = await Database.load("sqlite:assignments.db");
            await db.execute(
                "DROP TABLE IF EXISTS " + tableName
            );
            alert(`Table ${tableName} deleted successfully`);
            return `Table ${tableName} deleted successfully`; // Return null if there's no error
        } catch (error: any) {
            console.error("Save Error:", error);            
            alert(`Table ${tableName} deleted failed`);
            return `Failed to Delete ${tableName}: ${error.message || error}`;
        }
  }
}
