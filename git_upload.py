import subprocess
import sys
import os

def run(cmd, fail_msg=None):
    """Run a shell command safely and return output."""
    try:
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=True,
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print("\n❌ COMMAND FAILED:")
        print(" ".join(cmd))
        print(e.stderr.strip())
        if fail_msg:
            print(f"\n{fail_msg}")
        sys.exit(1)

def ensure_git_repo():
    if not os.path.exists(".git"):
        print("🔧 Initializing git repo")
        run(["git", "init"])

def abort_if_merge_in_progress():
    status = run(["git", "status"])
    if "merge" in status.lower():
        print("⚠️  Unfinished merge detected. Aborting merge.")
        run(["git", "merge", "--abort"], "Failed to abort merge.")

def ensure_remote(repo_url):
    remotes = run(["git", "remote"]).splitlines()
    if "origin" not in remotes:
        print("🔗 Adding origin remote")
        run(["git", "remote", "add", "origin", repo_url])
    else:
        print("🔁 Ensuring origin URL is correct")
        run(["git", "remote", "set-url", "origin", repo_url])

def ensure_main_branch():
    run(["git", "branch", "-M", "main"])

def commit_if_needed():
    status = run(["git", "status", "--porcelain"])
    if not status:
        print("ℹ️  Nothing to commit. Working tree clean.")
        return False

    print("📦 Staging files")
    run(["git", "add", "."])

    print("📝 Committing")
    run(
        ["git", "commit", "-m", "Automated upload"],
        "Commit failed."
    )
    return True

def push(force=False):
    cmd = ["git", "push", "-u", "origin", "main"]
    if force:
        cmd.append("--force")

    print("🚀 Pushing to GitHub")
    run(
        cmd,
        "Push failed. If this is a new repo with an existing README, try --force."
    )

def main():
    if len(sys.argv) < 2:
        print("Usage: python git_upload.py <repo_url> [--force]")
        sys.exit(1)

    repo_url = sys.argv[1]
    force = "--force" in sys.argv

    # Kill all editor prompts forever
    os.environ["GIT_EDITOR"] = "true"

    ensure_git_repo()
    abort_if_merge_in_progress()
    ensure_remote(repo_url)
    ensure_main_branch()
    commit_if_needed()
    push(force)

    print("\n✅ Upload complete.")

if __name__ == "__main__":
    main()
