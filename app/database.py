import sqlite3
from app.schemas import ShipmentCreate, ShipmentUpdate
from typing import Any

class Database:    
    def connect_to_db(self):
        self.conn = sqlite3.connect("sqlite.db",check_same_thread=False)
        self.cur = self.conn.cursor()
        print("connected to sqlite.db...")
        

    def create_table(self):
        self.cur.execute("""
            CREATE TABLE IF NOT EXISTS shipment(
                id INTEGER PRIMARY KEY,
                content TEXT,
                weight REAL,
                destination INTEGER,
                status TEXT
            )
        """)
        self.conn.commit()

    def create(self, shipment: ShipmentCreate) -> int:
        self.cur.execute(
            "SELECT MAX(id) FROM shipment"
        )
        result = self.cur.fetchone()
        new_id = (result[0] or 12700) + 1
        self.cur.execute("""
            INSERT INTO shipment
            VALUES (:id, :content, :weight, :destination, :status)
        """, {
            "id": new_id,
            "content": shipment.content,
            "weight": shipment.weight,
            "destination": shipment.destination,
            "status": "placed"
        })
        self.conn.commit()
        return new_id

    def get(self, id: int) -> dict[str, Any] | None:
        self.cur.execute("""
            SELECT id, content, weight, destination, status
            FROM shipment
            WHERE id=?
        """, (id,))
        row = self.cur.fetchone()
        if row is None:
            return None
        return {
            "id": row[0],
            "content": row[1],
            "weight": row[2],
            "destination": row[3],
            "status": row[4]
        }

    def update(self, id: int, shipment: ShipmentUpdate) -> dict[str, Any]:
        self.cur.execute("""
            UPDATE shipment
            SET status=:status
            WHERE id=:id
        """, {
            "id": id,
            **shipment.model_dump()
        })
        self.conn.commit()
        return self.get(id)

    def delete(self, id: int):
        self.cur.execute("""
            DELETE FROM shipment
            WHERE id=?
        """, (id,))
        self.conn.commit()
        
    def close(self):
        print("....connection closed")
        self.conn.close()
        
    def __enter__(self):
        print("Enter the context")
        self.connect_to_db()
        self.create_table()
        return self
    def __exit(self,*arg):
        print("Exiting the context")
        self.close()
        
    def managed_db():
        db=Database()
        #setup
        db.connect_to_db()
        db.create_table()
        
        return db
    
        db.close()

with Database() as db:
    print(db.get(12701))
    print(db.get(12702))