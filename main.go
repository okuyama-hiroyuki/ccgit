package main

import (
    "os/exec"
    "fmt"
)

func main() {
    // 単純なコマンド実行
    cmd := exec.Command("claude", "-p", "git commit")
    output, err := cmd.Output()
    if err != nil {
        fmt.Printf("エラー: %v\n", err)
        return
    }
    fmt.Printf("%s", output)
}
