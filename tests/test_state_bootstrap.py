

def test_bootstrap_copies_default_env_when_missing(monkeypatch, tmp_path):
    home = tmp_path / "helix"
    monkeypatch.setenv("HELIX_HOME", str(home))
    default_env = tmp_path / "default.env"
    default_env.write_text("HELIX_ENV=beta\n")
    monkeypatch.setenv("HELIX_DEFAULT_ENV", str(default_env))
    from helix.config import ensure_state_dir_bootstrapped
    ensure_state_dir_bootstrapped()
    assert (home / ".env").read_text() == "HELIX_ENV=beta\n"


def test_bootstrap_leaves_existing_env_alone(monkeypatch, tmp_path):
    home = tmp_path / "helix"
    home.mkdir()
    (home / ".env").write_text("HELIX_ENV=custom\n")
    monkeypatch.setenv("HELIX_HOME", str(home))
    default_env = tmp_path / "default.env"
    default_env.write_text("HELIX_ENV=beta\n")
    monkeypatch.setenv("HELIX_DEFAULT_ENV", str(default_env))
    from helix.config import ensure_state_dir_bootstrapped
    ensure_state_dir_bootstrapped()
    assert (home / ".env").read_text() == "HELIX_ENV=custom\n"
