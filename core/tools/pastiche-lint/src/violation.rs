use std::fmt;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ViolationFamily {
    Sentinel,
    Config,
    Fact,
    Wisdom,
    Knowledge,
}

impl fmt::Display for ViolationFamily {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ViolationFamily::Sentinel => write!(f, "sentinel"),
            ViolationFamily::Config => write!(f, "config"),
            ViolationFamily::Fact => write!(f, "fact"),
            ViolationFamily::Wisdom => write!(f, "wisdom"),
            ViolationFamily::Knowledge => write!(f, "knowledge"),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Violation {
    pub family: ViolationFamily,
    pub file: String,
    pub line: usize,
    pub message: String,
}
