export interface StudentProfileDto {
    bacType: string;
    specialties: string[];
    
    // Etape 2
    targetCourse: string;
    careerGoal?: string;
    
    // Etape 3 (Booleans)
    hasAttendedJPO: boolean;
    hasAttendedFairs: boolean;
    hasSpokenWithAlumni: boolean;
    isInCordeeReussite: boolean;
    
    // Etape 4 (Booleans + details)
    hasWorkExperience: boolean;
    workExperienceDetails?: string;
    hasVolunteering: boolean;
    volunteeringDetails?: string;
    hasSportOrArt: boolean;
    sportOrArtDetails?: string;
    
    // Etape 5
    softSkills: string[];
}