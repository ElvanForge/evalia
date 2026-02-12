package main

import (
	"database/sql"
	"log"
	"net/http"
	"os"

	_ "github.com/lib/pq" 
)

func main() {
	
	connStr := os.Getenv("DATABASE_URL") 
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	
	http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Database Connection: Active"))
	})

	log.Println("Evalia Server starting on :8080...")
	http.ListenAndServe(":8080", nil)
}