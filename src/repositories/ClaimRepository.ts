import {Claim} from "../models/entity/Claim";
import {getRepository} from "typeorm";

function findClaim(claimID:string): Promise<Claim> {
    return getRepository(Claim)
        .findOne({claimID:claimID})
        .then(claim => {
            if(!claim) {
                throw new Error("Claim not found.");
            }
            return claim;
        })
}

function storeClaim(claimID:string, claimHash:string): Promise<Claim> {
    let claim = new Claim();
    claim.claimID = claimID;
    claim.claimHash = claimHash;
    return getRepository(Claim).save(claim);
}

export {findClaim, storeClaim};